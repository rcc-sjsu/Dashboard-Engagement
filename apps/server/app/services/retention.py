from psycopg2.extensions import connection as Connection
from datetime import date

BUCKETS = ["0", "1", "2", "3", "4+"]

def _fill_buckets(rows):
    m = {r["events_attended_bucket"]: int(r["people"]) for r in rows}
    return [{"events_attended_bucket": b, "people": m.get(b, 0)} for b in BUCKETS]

def build_retention_payload(
    conn: Connection,
    *,
    members_table: str = "public.members",
    attendance_table: str = "public.event_attendance",
    members_email_col: str = "email",
    members_major_category_col: str = "major_category",
    attendee_email_col: str = "attendee_email",
    attendee_major_category_col: str = "attendee_major_category",
    event_id_col: str = "event_id",
    events_table: str = "public.events",
    semester_start: date | None = None,
    semester_end: date | None = None,
):
    is_filtered = semester_start is not None and semester_end is not None

    event_join_sql = (
        f"JOIN {events_table} e ON e.id = a.{event_id_col}"
        if is_filtered
        else ""
    )
    event_where_sql = (
        "AND e.starts_at >= %(semester_start)s AND e.starts_at < %(semester_end)s"
        if is_filtered
        else ""
    )

    overall_sql = f"""
    WITH raw_people AS (
      SELECT
        LOWER(TRIM(m.{members_email_col})) AS email,
        COALESCE(NULLIF(TRIM(m.{members_major_category_col}), ''), 'Unknown') AS major_category,
        1 AS source_priority
      FROM {members_table} m
      WHERE m.{members_email_col} IS NOT NULL

      UNION ALL

      SELECT
        LOWER(TRIM(a.{attendee_email_col})) AS email,
        COALESCE(NULLIF(TRIM(a.{attendee_major_category_col}), ''), 'Unknown') AS major_category,
        2 AS source_priority
      FROM {attendance_table} a
      {event_join_sql}
      WHERE a.{attendee_email_col} IS NOT NULL
      {event_where_sql}
    ),
    people AS (
      SELECT DISTINCT ON (email)
        email,
        major_category
      FROM raw_people
      WHERE email <> ''
      ORDER BY email, source_priority
    ),
    attendance_counts AS (
      SELECT
        LOWER(TRIM(a.{attendee_email_col})) AS email,
        COUNT(DISTINCT a.{event_id_col}) AS events_attended
      FROM {attendance_table} a
      {event_join_sql}
      WHERE a.{attendee_email_col} IS NOT NULL
      {event_where_sql}
      GROUP BY 1
    ),
    per_person AS (
      SELECT
        p.email,
        COALESCE(ac.events_attended, 0) AS events_attended
      FROM people p
      LEFT JOIN attendance_counts ac
        ON ac.email = p.email
    )
    SELECT
      CASE WHEN events_attended >= 4 THEN '4+' ELSE events_attended::text END AS events_attended_bucket,
      COUNT(*)::int AS people
    FROM per_person
    GROUP BY 1;
    """

    by_major_sql = f"""
    WITH raw_people AS (
      SELECT
        LOWER(TRIM(m.{members_email_col})) AS email,
        COALESCE(NULLIF(TRIM(m.{members_major_category_col}), ''), 'Unknown') AS major_category,
        1 AS source_priority
      FROM {members_table} m
      WHERE m.{members_email_col} IS NOT NULL

      UNION ALL

      SELECT
        LOWER(TRIM(a.{attendee_email_col})) AS email,
        COALESCE(NULLIF(TRIM(a.{attendee_major_category_col}), ''), 'Unknown') AS major_category,
        2 AS source_priority
      FROM {attendance_table} a
      {event_join_sql}
      WHERE a.{attendee_email_col} IS NOT NULL
      {event_where_sql}
    ),
    people AS (
      SELECT DISTINCT ON (email)
        email,
        major_category
      FROM raw_people
      WHERE email <> ''
      ORDER BY email, source_priority
    ),
    attendance_counts AS (
      SELECT
        LOWER(TRIM(a.{attendee_email_col})) AS email,
        COUNT(DISTINCT a.{event_id_col}) AS events_attended
      FROM {attendance_table} a
      {event_join_sql}
      WHERE a.{attendee_email_col} IS NOT NULL
      {event_where_sql}
      GROUP BY 1
    ),
    per_person AS (
      SELECT
        p.email,
        p.major_category,
        COALESCE(ac.events_attended, 0) AS events_attended
      FROM people p
      LEFT JOIN attendance_counts ac
        ON ac.email = p.email
    )
    SELECT
      major_category,
      CASE WHEN events_attended >= 4 THEN '4+' ELSE events_attended::text END AS events_attended_bucket,
      COUNT(*)::int AS people
    FROM per_person
    GROUP BY major_category, events_attended_bucket;
    """

    with conn.cursor() as cur:
        params = (
            {
                "semester_start": semester_start,
                "semester_end": semester_end,
            }
            if is_filtered
            else None
        )

        if params:
            cur.execute(overall_sql, params)
        else:
            cur.execute(overall_sql)
        overall_rows = cur.fetchall()
        if params:
            cur.execute(by_major_sql, params)
        else:
            cur.execute(by_major_sql)
        by_major_rows = cur.fetchall()

    overall = _fill_buckets(overall_rows)

    grouped = {}
    for r in by_major_rows:
        grouped.setdefault(r["major_category"], []).append(
            {"events_attended_bucket": r["events_attended_bucket"], "people": r["people"]}
        )

    by_major = [
        {"major_category": k, "distribution": _fill_buckets(v)}
        for k, v in grouped.items()
    ]

    return {
        "retention": {
            "attendance_count_distribution_overall": overall,
            "attendance_count_distribution_by_major_category": by_major,
        }
    }
