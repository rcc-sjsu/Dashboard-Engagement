"""Registration growth, engagement cohorts, and semester-specific activity."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from psycopg2.extensions import connection as Connection

from app.services.active_membership import build_active_membership_payload
from app.services.engagement import build_engagement_kpis


def build_overview_payload(
    conn: Connection,
    *,
    members_table: str = "public.members",
    attendance_table: str = "public.event_attendance",
    events_table: str = "public.events",
    semester_start: date | None = None,
    semester_end: date | None = None,
    as_of: datetime | None = None,
):
    """Semester filters select registration / first-event cohorts. Official
    membership is the roster by the semester cutoff, including earlier joiners.
    Active status is recalculated independently within each semester.
    """
    is_filtered = semester_start is not None and semester_end is not None
    params = {"semester_start": semester_start, "semester_end": semester_end, "as_of": as_of}
    registrations_cte = f"""
        snapshot AS (
            SELECT COALESCE(%(as_of)s::timestamptz, CURRENT_TIMESTAMP) AS as_of
        ), registrations AS (
            SELECT LOWER(TRIM(email)) AS email, MIN(joined_at) AS registered_at
            FROM {members_table}
            WHERE NULLIF(TRIM(email), '') IS NOT NULL
            GROUP BY 1
        ), cohort AS (
            SELECT r.* FROM registrations r CROSS JOIN snapshot s
            WHERE (r.registered_at IS NULL OR r.registered_at <= s.as_of)
              AND (%(semester_start)s::date IS NULL OR r.registered_at >= %(semester_start)s)
              AND (%(semester_end)s::date IS NULL OR r.registered_at < %(semester_end)s)
        )
    """
    with conn.cursor() as cur:
        cur.execute(f"""
            WITH {registrations_cte}, growth AS (
                SELECT
                    COUNT(*) FILTER (WHERE registered_at >= s.as_of - INTERVAL '30 days')::int AS recent,
                    COUNT(*) FILTER (
                        WHERE registered_at >= s.as_of - INTERVAL '60 days'
                          AND registered_at < s.as_of - INTERVAL '30 days'
                    )::int AS previous
                FROM cohort CROSS JOIN snapshot s
            )
            SELECT
                (SELECT COUNT(*)::int FROM cohort) AS total_members,
                (SELECT COUNT(*)::int FROM registrations
                 WHERE registered_at IS NULL OR registered_at <= s.as_of) AS official_members,
                g.recent, g.previous,
                ROUND(100.0 * (g.recent - g.previous) / NULLIF(g.previous, 0), 1) AS growth_pct,
                (SELECT MIN(registered_at)::date FROM registrations WHERE registered_at <= s.as_of) AS start_date,
                s.as_of::date AS end_date
            FROM growth g CROSS JOIN snapshot s;
        """, params)
        stats = cur.fetchone()

        # Semester activity has its own table/card. The growth chart tracks
        # registrations, without mixing historical and current active flags.
        cur.execute(f"""
            WITH {registrations_cte}
            SELECT TO_CHAR(month, 'YYYY-MM') AS period,
                   (SELECT COUNT(*)::int FROM cohort WHERE registered_at < month + INTERVAL '1 month')
                       AS registered_members_cumulative
            FROM snapshot s CROSS JOIN LATERAL generate_series(
                DATE_TRUNC('month', COALESCE(%(semester_start)s::timestamptz,
                    (SELECT MIN(registered_at) FROM cohort))),
                DATE_TRUNC('month', LEAST(s.as_of,
                    COALESCE(%(semester_end)s::timestamptz - INTERVAL '1 day', s.as_of))),
                INTERVAL '1 month'
            ) AS month
            ORDER BY month;
        """, params)
        time_series_rows = cur.fetchall()

    engagement = build_engagement_kpis(
        conn, members_table=members_table, attendance_table=attendance_table,
        events_table=events_table, semester_start=semester_start,
        semester_end=semester_end, as_of=as_of,
    )
    activity = build_active_membership_payload(
        conn, members_table=members_table, attendance_table=attendance_table,
        events_table=events_table, semester_start=semester_start,
        semester_end=semester_end, as_of=as_of,
    )
    selected_activity = activity["selected_semester"]

    return {
        "overview": {
            "kpis": {
                "total_members": stats["total_members"],
                "official_members": selected_activity["official_members"] if selected_activity else stats["official_members"],
                "active_members": selected_activity["active_members"] if selected_activity else None,
                "active_members_pct": selected_activity["active_rate"] if selected_activity else None,
                "registered_growth_last_30d_pct": float(stats["growth_pct"]) if stats["growth_pct"] is not None else None,
                "registered_last_30d": stats["recent"],
                "registered_previous_30d": stats["previous"],
                "new_member_activation_30d": engagement["new_member_activation_30d"],
                "first_time_attendee_second_event": engagement["first_time_attendee_second_event"],
            },
            "active_members_by_semester": activity["semesters"],
            "members_over_time": [dict(row) for row in time_series_rows],
        },
        "meta": {
            "start": semester_start.isoformat() if is_filtered else stats["start_date"].isoformat() if stats["start_date"] else None,
            "end": (semester_end - timedelta(days=1)).isoformat() if is_filtered else stats["end_date"].isoformat(),
            "as_of": engagement["as_of"],
        },
    }
