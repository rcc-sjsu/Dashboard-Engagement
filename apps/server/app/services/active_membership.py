"""Semester-specific active membership, computed from recorded event attendance."""

from datetime import date, datetime, timezone

from psycopg2.extensions import connection as Connection

from app.services.semester import (
    _bounds_for_term,
    _semester_label,
    _semester_sort_key,
    _term_for_date,
)


def build_active_membership_payload(
    conn: Connection,
    *,
    members_table: str = "public.members",
    attendance_table: str = "public.event_attendance",
    events_table: str = "public.events",
    semester_start: date | None = None,
    semester_end: date | None = None,
    as_of: datetime | None = None,
):
    """Count official members with social AND non-social attendance per semester.

    The denominator is the roster registered by the reporting cutoff, including
    people who joined in earlier semesters. Historical registration dates must be
    known. Attendance before registration can qualify a person after they join,
    provided both events and registration precede that semester's cutoff.

    All-semester results never combine qualifying events from different terms.
    Explicit selected bounds force a row even when the semester has no events.
    """
    if (semester_start is None) != (semester_end is None):
        raise ValueError("Both semester_start and semester_end are required together.")

    selected_value = None
    if semester_start is not None:
        term_parts = _term_for_date(semester_start)
        if term_parts is None or _bounds_for_term(*term_parts) != (semester_start, semester_end):
            raise ValueError("Active membership requires a complete configured semester.")
        year, term = term_parts
        selected_value = f"{year}-{term}"

    with conn.cursor() as cur:
        cur.execute(f"""
            WITH registrations AS (
                SELECT LOWER(TRIM(email)) AS email, MIN(joined_at) AS registered_at
                FROM {members_table}
                WHERE NULLIF(TRIM(email), '') IS NOT NULL
                GROUP BY 1
            )
            SELECT COALESCE(%(as_of)s::timestamptz, CURRENT_TIMESTAMP) AS as_of,
                   COUNT(*) FILTER (WHERE registered_at IS NULL)::int
                       AS members_without_registration_date
            FROM registrations;
        """, {"as_of": as_of})
        snapshot = cur.fetchone()

    snapshot_at = snapshot["as_of"]
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT DISTINCT DATE(starts_at) AS event_date
            FROM {events_table}
            WHERE starts_at <= %(as_of)s;
        """, {"as_of": snapshot_at})
        event_dates = cur.fetchall()

    options = {}
    for row in event_dates:
        term_parts = _term_for_date(row["event_date"])
        if term_parts is None:
            continue
        year, term = term_parts
        start, end = _bounds_for_term(year, term)
        value = f"{year}-{term}"
        options[value] = {
            "value": value,
            "label": _semester_label(year, term),
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
        }
    if selected_value is not None:
        year, term = _term_for_date(semester_start)
        options[selected_value] = {
            "value": selected_value,
            "label": _semester_label(year, term),
            "start_date": semester_start.isoformat(),
            "end_date": semester_end.isoformat(),
        }

    ordered_options = [
        options[value]
        for value in sorted(options, key=_semester_sort_key, reverse=True)
    ]
    rows = []
    if ordered_options:
        sql = f"""
        WITH semesters AS (
            SELECT * FROM unnest(
                %(values)s::text[], %(labels)s::text[],
                %(starts)s::date[], %(ends)s::date[]
            ) AS terms(value, label, start_date, end_date)
        ), registrations AS (
            SELECT LOWER(TRIM(email)) AS email, MIN(joined_at) AS registered_at
            FROM {members_table}
            WHERE NULLIF(TRIM(email), '') IS NOT NULL
            GROUP BY 1
        ), attendance AS (
            SELECT DISTINCT
                LOWER(COALESCE(NULLIF(TRIM(a.member_email), ''),
                               NULLIF(TRIM(a.attendee_email), ''))) AS email,
                e.id AS event_id,
                e.starts_at,
                LOWER(TRIM(e.event_kind)) AS event_kind
            FROM {attendance_table} a
            JOIN {events_table} e ON e.id = a.event_id
            WHERE e.starts_at <= %(as_of)s
              AND LOWER(TRIM(e.event_kind)) IN ('social', 'nonsocial')
        ), qualified AS (
            SELECT s.value, a.email
            FROM semesters s
            JOIN attendance a
              ON a.starts_at >= s.start_date AND a.starts_at < s.end_date
            WHERE a.email IS NOT NULL
            GROUP BY s.value, a.email
            HAVING BOOL_OR(a.event_kind = 'social')
               AND BOOL_OR(a.event_kind = 'nonsocial')
        )
        SELECT s.value, s.label, s.start_date, s.end_date,
               COUNT(r.email)::int AS official_members,
               COUNT(q.email)::int AS active_members,
               ROUND(100.0 * COUNT(q.email) / NULLIF(COUNT(r.email), 0), 1)
                   AS active_rate
        FROM semesters s
        LEFT JOIN registrations r
          ON r.registered_at < s.end_date
         AND r.registered_at <= %(as_of)s
         AND s.start_date <= %(as_of)s
        LEFT JOIN qualified q ON q.value = s.value AND q.email = r.email
        GROUP BY s.value, s.label, s.start_date, s.end_date
        ORDER BY s.start_date DESC;
        """
        with conn.cursor() as cur:
            cur.execute(sql, {
                "values": [option["value"] for option in ordered_options],
                "labels": [option["label"] for option in ordered_options],
                "starts": [option["start_date"] for option in ordered_options],
                "ends": [option["end_date"] for option in ordered_options],
                "as_of": snapshot_at,
            })
            rows = [
                {
                    "value": row["value"],
                    "label": row["label"],
                    "start_date": row["start_date"].isoformat(),
                    "end_date": row["end_date"].isoformat(),
                    "official_members": row["official_members"],
                    "active_members": row["active_members"],
                    "active_rate": float(row["active_rate"]) if row["active_rate"] is not None else None,
                }
                for row in cur.fetchall()
            ]

    return {
        "semesters": rows,
        "selected_semester": next((row for row in rows if row["value"] == selected_value), None),
        "as_of": snapshot_at.astimezone(timezone.utc).isoformat(),
        "members_without_registration_date": snapshot["members_without_registration_date"],
    }
