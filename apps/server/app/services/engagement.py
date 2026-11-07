"""Registration activation and second-event engagement, independent of active status."""

from datetime import date, datetime, timezone

from psycopg2.extensions import connection as Connection


def build_engagement_kpis(
    conn: Connection,
    *,
    members_table: str = "public.members",
    attendance_table: str = "public.event_attendance",
    events_table: str = "public.events",
    semester_start: date | None = None,
    semester_end: date | None = None,
    as_of: datetime | None = None,
):
    """Select cohorts by registration / first recorded event, then follow them
    across semester boundaries. Activation requires a complete 30-day window
    with at least one recorded event opportunity. Second-event rate includes all
    first attendees through the snapshot, without a fixed follow-up window:
    recent and last-event attendees remain eligible, so follow-up time varies.
    `as_of` is injectable for deterministic tests; production uses database time.
    """
    sql = f"""
    WITH snapshot AS (
        SELECT COALESCE(%(as_of)s::timestamptz, CURRENT_TIMESTAMP) AS as_of
    ), registrations AS (
        SELECT LOWER(TRIM(email)) AS email, MIN(joined_at) AS registered_at
        FROM {members_table}
        WHERE NULLIF(TRIM(email), '') IS NOT NULL AND joined_at IS NOT NULL
        GROUP BY 1
    ), event_opportunities AS (
        -- An imported event is an opportunity even if nobody attended it.
        SELECT e.id AS event_id, e.starts_at
        FROM {events_table} e CROSS JOIN snapshot s
        WHERE e.starts_at <= s.as_of
    ), attendance AS (
        SELECT DISTINCT
            LOWER(COALESCE(NULLIF(TRIM(a.member_email), ''),
                           NULLIF(TRIM(a.attendee_email), ''))) AS email,
            e.event_id, e.starts_at
        FROM {attendance_table} a
        JOIN event_opportunities e ON e.event_id = a.event_id
    ), first_attendance AS (
        -- Determine the first event from ALL history, before filtering cohorts.
        SELECT email, MIN(starts_at) AS first_at
        FROM attendance
        WHERE email IS NOT NULL
        GROUP BY email
    ), activation_candidates AS (
        SELECT r.*, EXISTS (
            SELECT 1 FROM event_opportunities e
            WHERE e.starts_at >= r.registered_at
              AND e.starts_at <= r.registered_at + INTERVAL '30 days'
        ) AS had_opportunity, EXISTS (
            SELECT 1 FROM attendance a
            WHERE a.email = r.email
              AND a.starts_at >= r.registered_at
              AND a.starts_at <= r.registered_at + INTERVAL '30 days'
        ) AS succeeded
        FROM registrations r CROSS JOIN snapshot s
        WHERE r.registered_at + INTERVAL '30 days' <= s.as_of
          AND (%(semester_start)s::date IS NULL OR r.registered_at >= %(semester_start)s)
          AND (%(semester_end)s::date IS NULL OR r.registered_at < %(semester_end)s)
    ), activation_cohort AS (
        SELECT * FROM activation_candidates WHERE had_opportunity
    ), second_event_cohort AS (
        SELECT f.*, EXISTS (
            SELECT 1 FROM attendance a
            WHERE a.email = f.email
              AND a.starts_at > f.first_at
        ) AS succeeded
        FROM first_attendance f
        WHERE (%(semester_start)s::date IS NULL OR f.first_at >= %(semester_start)s)
          AND (%(semester_end)s::date IS NULL OR f.first_at < %(semester_end)s)
    )
    SELECT s.as_of,
        (SELECT COUNT(*) FROM activation_cohort) AS activation_eligible,
        (SELECT COUNT(*) FROM activation_cohort WHERE succeeded) AS activation_successful,
        (SELECT COUNT(*) FROM activation_candidates WHERE NOT had_opportunity) AS activation_no_opportunity,
        (SELECT COUNT(*) FROM second_event_cohort) AS second_event_eligible,
        (SELECT COUNT(*) FROM second_event_cohort WHERE succeeded) AS second_event_successful
    FROM snapshot s;
    """
    with conn.cursor() as cur:
        cur.execute(sql, {
            "as_of": as_of,
            "semester_start": semester_start,
            "semester_end": semester_end,
        })
        row = cur.fetchone()

    def metric(prefix, days):
        eligible = int(row[f"{prefix}_eligible"])
        successful = int(row[f"{prefix}_successful"])
        return {
            "percentage": round(100 * successful / eligible, 1) if eligible else None,
            "successful": successful,
            "eligible": eligible,
            "window_days": days,
        }

    activation = metric("activation", 30)
    activation["excluded_no_opportunity"] = int(row["activation_no_opportunity"])

    return {
        "new_member_activation_30d": activation,
        "first_time_attendee_second_event": metric("second_event", None),
        "as_of": row["as_of"].astimezone(timezone.utc).isoformat(),
    }
