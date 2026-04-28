"""
Mission analytics service for member demographics and event diversity analysis.

Provides breakdowns of member composition by major and class year, plus analysis
of event attendance diversity across different academic majors.
"""

from __future__ import annotations

from datetime import date

from psycopg2.extensions import connection as Connection


def build_mission_payload(
    conn: Connection,
    *,
    members_table: str = "public.members",
    events_table: str = "public.events",
    attendance_table: str = "public.event_attendance",
    semester_start: date | None = None,
    semester_end: date | None = None,
):
    """
    Mission analytics: member demographics + event diversity

    If semester_start and semester_end are provided, demographic distributions are
    scoped to members who attended at least one event in that semester and event
    diversity is restricted to semester events.
    """

    is_filtered = semester_start is not None and semester_end is not None

    norm_major_category_sql = """
        COALESCE(
          NULLIF(
            CASE
              WHEN major_category = 'Unknown/other' THEN 'Other/Unknown'
              ELSE major_category
            END,
            ''
          ),
          'Other/Unknown'
        )
    """

    norm_class_year_sql = "COALESCE(NULLIF(TRIM(class_year), ''), 'Other/Unknown')"

    if is_filtered:
        major_dist_sql = f"""
        SELECT
            {norm_major_category_sql} AS major_category,
            COUNT(*)::int AS members
        FROM {members_table} m
        WHERE EXISTS (
            SELECT 1
            FROM {attendance_table} a
            JOIN {events_table} e ON e.id = a.event_id
            WHERE e.starts_at >= %(semester_start)s
              AND e.starts_at < %(semester_end)s
              AND (
                (a.member_email IS NOT NULL AND LOWER(TRIM(a.member_email)) = LOWER(TRIM(m.email)))
                OR (a.attendee_email IS NOT NULL AND LOWER(TRIM(a.attendee_email)) = LOWER(TRIM(m.email)))
              )
        )
        GROUP BY 1
        ORDER BY members DESC;
        """

        class_year_sql = f"""
        WITH grouped_class_year AS (
            SELECT
                {norm_class_year_sql} AS class_year,
                COUNT(*)::int AS members
            FROM {members_table} m
            WHERE EXISTS (
                SELECT 1
                FROM {attendance_table} a
                JOIN {events_table} e ON e.id = a.event_id
                WHERE e.starts_at >= %(semester_start)s
                  AND e.starts_at < %(semester_end)s
                  AND (
                    (a.member_email IS NOT NULL AND LOWER(TRIM(a.member_email)) = LOWER(TRIM(m.email)))
                    OR (a.attendee_email IS NOT NULL AND LOWER(TRIM(a.attendee_email)) = LOWER(TRIM(m.email)))
                  )
            )
            GROUP BY 1
        )
        SELECT class_year, members
        FROM grouped_class_year
        ORDER BY
            CASE class_year
                WHEN 'Freshman' THEN 1
                WHEN 'Sophomore' THEN 2
                WHEN 'Junior' THEN 3
                WHEN 'Senior' THEN 4
                WHEN 'Grad' THEN 5
                ELSE 6
            END,
            class_year;
        """

        event_filter_clause = "WHERE e.starts_at >= %(semester_start)s AND e.starts_at < %(semester_end)s"
        params = {
            "semester_start": semester_start,
            "semester_end": semester_end,
        }
    else:
        major_dist_sql = f"""
        SELECT
            {norm_major_category_sql} AS major_category,
            COUNT(*)::int AS members
        FROM {members_table}
        GROUP BY 1
        ORDER BY members DESC;
        """

        class_year_sql = f"""
        WITH grouped_class_year AS (
            SELECT
                {norm_class_year_sql} AS class_year,
                COUNT(*)::int AS members
            FROM {members_table}
            GROUP BY 1
        )
        SELECT class_year, members
        FROM grouped_class_year
        ORDER BY
            CASE class_year
                WHEN 'Freshman' THEN 1
                WHEN 'Sophomore' THEN 2
                WHEN 'Junior' THEN 3
                WHEN 'Senior' THEN 4
                WHEN 'Grad' THEN 5
                ELSE 6
            END,
            class_year;
        """

        event_filter_clause = ""
        params = None

    event_diversity_sql = f"""
    WITH event_attendance_counts AS (
        SELECT
            e.id AS event_id,
            e.title AS event_title,
            e.starts_at,
            COUNT(DISTINCT a.attendee_email)::int AS total_attendees
        FROM {events_table} e
        LEFT JOIN {attendance_table} a ON e.id = a.event_id
        {event_filter_clause}
        GROUP BY e.id, e.title, e.starts_at
        HAVING COUNT(DISTINCT a.attendee_email) > 0
        ORDER BY total_attendees DESC
        LIMIT 10
    ),
    event_major_breakdown AS (
        SELECT
            a.event_id,
            COALESCE(
              NULLIF(
                CASE
                    WHEN COALESCE(m.major_category, a.attendee_major_category) = 'Unknown/other' THEN 'Other/Unknown'
                    ELSE COALESCE(m.major_category, a.attendee_major_category)
                END,
                ''
              ),
              'Other/Unknown'
            ) AS major_category,
            COUNT(DISTINCT a.attendee_email)::int AS count
        FROM {attendance_table} a
        LEFT JOIN {members_table} m ON a.member_email = m.email
        WHERE a.event_id IN (SELECT event_id FROM event_attendance_counts)
        GROUP BY a.event_id, 2
    )
    SELECT
        eac.event_id,
        eac.event_title,
        eac.starts_at,
        eac.total_attendees,
        emb.major_category,
        emb.count,
        ROUND(emb.count::numeric / NULLIF(eac.total_attendees, 0), 4) AS pct
    FROM event_attendance_counts eac
    JOIN event_major_breakdown emb ON eac.event_id = emb.event_id
    ORDER BY eac.total_attendees DESC, emb.count DESC;
    """

    with conn.cursor() as cur:
        if params:
            cur.execute(major_dist_sql, params)
        else:
            cur.execute(major_dist_sql)
        major_dist = cur.fetchall()

        if params:
            cur.execute(class_year_sql, params)
        else:
            cur.execute(class_year_sql)
        class_year_dist = cur.fetchall()

        if params:
            cur.execute(event_diversity_sql, params)
        else:
            cur.execute(event_diversity_sql)
        event_rows = cur.fetchall()

    events_dict = {}
    for row in event_rows:
        event_id = str(row["event_id"])

        if event_id not in events_dict:
            events_dict[event_id] = {
                "event_id": event_id,
                "event_title": row["event_title"],
                "starts_at": row["starts_at"].isoformat() if row["starts_at"] else None,
                "total_attendees": row["total_attendees"],
                "segments": [],
            }

        events_dict[event_id]["segments"].append(
            {
                "major_category": row["major_category"],
                "pct": float(row["pct"]),
                "count": row["count"],
            }
        )

    return {
        "mission": {
            "major_category_distribution": [
                {"major_category": row["major_category"], "members": row["members"]}
                for row in major_dist
            ],
            "class_year_distribution": [
                {"class_year": row["class_year"], "members": row["members"]}
                for row in class_year_dist
            ],
            "event_major_category_percent": list(events_dict.values()),
        }
    }
