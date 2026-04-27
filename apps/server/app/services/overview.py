"""
Overview analytics service for member registration and activity metrics.

Provides KPIs and time-series data for tracking member growth and engagement.
"""

from __future__ import annotations

from datetime import date, timedelta

from psycopg2.extensions import connection as Connection


def build_overview_payload(
    conn: Connection,
    *,
    members_table: str = "public.members",
    attendance_table: str = "public.event_attendance",
    semester_start: date | None = None,
    semester_end: date | None = None,
):
    """
    Build overview analytics payload for the dashboard.

    Returns a payload with:
    - Total members count
    - Active members count and percentage
    - Growth rate
    - Monthly time-series of cumulative member counts

    If semester_start and semester_end are provided, calculations are scoped to
    that date window [semester_start, semester_end).
    """

    _ = attendance_table  # kept for compatibility with existing function signature

    is_filtered = semester_start is not None and semester_end is not None

    if is_filtered:
        kpis_sql = f"""
        WITH stats AS (
            SELECT
                COUNT(*)::int AS total_members,
                COUNT(*) FILTER (WHERE is_active_member = TRUE)::int AS active_members
            FROM {members_table}
            WHERE joined_at >= %(semester_start)s
              AND joined_at < %(semester_end)s
        ),
        growth AS (
            SELECT
                COUNT(*) FILTER (
                    WHERE joined_at >= GREATEST(%(semester_start)s, CURRENT_DATE - INTERVAL '30 days')
                      AND joined_at < %(semester_end)s
                )::int AS recent_30d,
                COUNT(*) FILTER (
                    WHERE joined_at >= GREATEST(%(semester_start)s, CURRENT_DATE - INTERVAL '60 days')
                      AND joined_at < GREATEST(%(semester_start)s, CURRENT_DATE - INTERVAL '30 days')
                )::int AS previous_30d
            FROM {members_table}
            WHERE joined_at >= %(semester_start)s
              AND joined_at < %(semester_end)s
        )
        SELECT
            s.total_members,
            s.active_members,
            ROUND(100.0 * s.active_members / NULLIF(s.total_members, 0), 1) AS active_members_pct,
            CASE
                WHEN g.previous_30d = 0 THEN 0.0
                ELSE ROUND(100.0 * (g.recent_30d - g.previous_30d) / g.previous_30d, 1)
            END AS registered_growth_last_30d_pct
        FROM stats s, growth g;
        """

        time_series_sql = f"""
        SELECT
            TO_CHAR(date_series, 'YYYY-MM') AS period,
            (
                SELECT COUNT(*)::int
                FROM {members_table}
                WHERE joined_at >= %(semester_start)s
                  AND joined_at < %(semester_end)s
                  AND joined_at < (date_series + INTERVAL '1 month')
            ) AS registered_members_cumulative,
            (
                SELECT COUNT(*)::int
                FROM {members_table}
                WHERE is_active_member = TRUE
                  AND active_member_start_date IS NOT NULL
                  AND active_member_start_date >= %(semester_start)s
                  AND active_member_start_date < %(semester_end)s
                  AND active_member_start_date < (date_series + INTERVAL '1 month')
            ) AS active_members_cumulative
        FROM generate_series(
            DATE_TRUNC('month', %(semester_start)s::date),
            DATE_TRUNC('month', (%(semester_end)s::date - INTERVAL '1 day')),
            INTERVAL '1 month'
        ) AS date_series
        ORDER BY date_series;
        """

        params = {
            "semester_start": semester_start,
            "semester_end": semester_end,
        }

        meta_start = semester_start.isoformat()
        meta_end = (semester_end - timedelta(days=1)).isoformat()
    else:
        kpis_sql = f"""
        WITH stats AS (
            SELECT
                COUNT(*)::int AS total_members,
                COUNT(*) FILTER (WHERE is_active_member = TRUE)::int AS active_members
            FROM {members_table}
        ),
        growth AS (
            SELECT
                COUNT(*) FILTER (WHERE joined_at >= CURRENT_DATE - INTERVAL '30 days')::int AS recent_30d,
                COUNT(*) FILTER (WHERE joined_at >= CURRENT_DATE - INTERVAL '60 days' AND joined_at < CURRENT_DATE - INTERVAL '30 days')::int AS previous_30d
            FROM {members_table}
        )
        SELECT
            s.total_members,
            s.active_members,
            ROUND(100.0 * s.active_members / NULLIF(s.total_members, 0), 1) AS active_members_pct,
            CASE WHEN g.previous_30d = 0 THEN 0.0 ELSE ROUND(100.0 * (g.recent_30d - g.previous_30d) / g.previous_30d, 1) END AS registered_growth_last_30d_pct
        FROM stats s, growth g;
        """

        time_series_sql = f"""
        SELECT
            TO_CHAR(date_series, 'YYYY-MM') AS period,
            (
                SELECT COUNT(*)::int
                FROM {members_table}
                WHERE joined_at < (date_series + INTERVAL '1 month')
            ) AS registered_members_cumulative,
            (
                SELECT COUNT(*)::int
                FROM {members_table}
                WHERE is_active_member = TRUE
                  AND active_member_start_date IS NOT NULL
                  AND active_member_start_date < (date_series + INTERVAL '1 month')
            ) AS active_members_cumulative
        FROM generate_series((SELECT DATE_TRUNC('month', MIN(joined_at)) FROM {members_table}), DATE_TRUNC('month', CURRENT_DATE), INTERVAL '1 month') AS date_series
        ORDER BY date_series;
        """

        params = None
        meta_start = None
        meta_end = None

    with conn.cursor() as cur:
        if params:
            cur.execute(kpis_sql, params)
        else:
            cur.execute(kpis_sql)
        kpis_row = cur.fetchone()

        if params:
            cur.execute(time_series_sql, params)
        else:
            cur.execute(time_series_sql)
        time_series_rows = cur.fetchall()

        if not is_filtered:
            cur.execute(
                f"""
                SELECT
                    DATE(MIN(joined_at)) AS start_date,
                    CURRENT_DATE::date AS end_date
                FROM {members_table};
                """
            )
            meta_row = cur.fetchone()
            if meta_row:
                meta_start = (
                    meta_row["start_date"].isoformat()
                    if meta_row.get("start_date") is not None
                    else None
                )
                meta_end = (
                    meta_row["end_date"].isoformat()
                    if meta_row.get("end_date") is not None
                    else None
                )

    return {
        "overview": {
            "kpis": {
                "total_members": kpis_row["total_members"],
                "active_members": kpis_row["active_members"],
                "active_members_pct": float(kpis_row["active_members_pct"] or 0.0),
                "registered_growth_last_30d_pct": float(
                    kpis_row["registered_growth_last_30d_pct"] or 0.0
                ),
            },
            "members_over_time": [
                {
                    "period": row["period"],
                    "registered_members_cumulative": row[
                        "registered_members_cumulative"
                    ],
                    "active_members_cumulative": row["active_members_cumulative"],
                }
                for row in time_series_rows
            ],
        },
        "meta": {
            "start": meta_start,
            "end": meta_end,
        },
    }
