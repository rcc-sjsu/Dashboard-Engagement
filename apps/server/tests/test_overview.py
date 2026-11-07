"""Overview API integration contract, using only temporary database tables."""

import os
import unittest
from datetime import date, datetime, timedelta, timezone

import psycopg2
from psycopg2.extras import RealDictCursor

from app.services.overview import build_overview_payload


AS_OF = datetime(2026, 11, 6, 12, tzinfo=timezone.utc)
DAY = timedelta(days=1)


def at(iso_date):
    return datetime.fromisoformat(iso_date).replace(tzinfo=timezone.utc)


@unittest.skipUnless(os.environ.get("TEST_DATABASE_URL"), "Set TEST_DATABASE_URL to an isolated test database")
class OverviewTests(unittest.TestCase):
    def setUp(self):
        self.conn = psycopg2.connect(os.environ["TEST_DATABASE_URL"], cursor_factory=RealDictCursor)
        self.addCleanup(self.conn.close)
        with self.conn.cursor() as cur:
            cur.execute("""
                SET TIME ZONE 'UTC';
                CREATE TEMP TABLE overview_test_members (
                    email text, joined_at timestamptz, is_active_member boolean DEFAULT false
                );
                CREATE TEMP TABLE overview_test_events (
                    id int PRIMARY KEY, starts_at timestamptz, event_kind text
                );
                CREATE TEMP TABLE overview_test_attendance (
                    event_id int, attendee_email text, member_email text
                );
            """)
        self.next_event_id = 1

    def member(self, email, joined_at, *, legacy_active=False):
        with self.conn.cursor() as cur:
            cur.execute("INSERT INTO overview_test_members VALUES (%s, %s, %s)", (email, joined_at, legacy_active))

    def attend(self, email, starts_at, kind):
        event_id = self.next_event_id
        self.next_event_id += 1
        with self.conn.cursor() as cur:
            cur.execute("INSERT INTO overview_test_events VALUES (%s, %s, %s)", (event_id, starts_at, kind))
            cur.execute("INSERT INTO overview_test_attendance VALUES (%s, %s, NULL)", (event_id, email))

    def payload(self, *, as_of=AS_OF, **kwargs):
        return build_overview_payload(
            self.conn, members_table="overview_test_members",
            attendance_table="overview_test_attendance", events_table="overview_test_events",
            as_of=as_of, **kwargs,
        )

    def fall(self, **kwargs):
        return self.payload(semester_start=date(2026, 8, 20), semester_end=date(2026, 12, 25), **kwargs)

    def test_selected_roster_and_registration_cohort_are_distinct(self):
        self.member("prior-member", at("2025-09-01"))
        self.member("new-member", at("2026-09-01"))
        self.member("not-yet-active", at("2026-10-01"), legacy_active=True)
        for email in ("prior-member", "new-member"):
            self.attend(email, at("2026-09-02"), "social")
            self.attend(email, at("2026-09-03"), "nonsocial")
        payload = self.fall()
        kpis = payload["overview"]["kpis"]
        self.assertEqual(kpis["total_members"], 2)
        self.assertEqual(kpis["official_members"], 3)
        self.assertEqual(kpis["active_members"], 2)
        self.assertEqual(kpis["active_members_pct"], 66.7)
        semester = next(row for row in payload["overview"]["active_members_by_semester"] if row["value"] == "2026-fall")
        self.assertEqual(semester["official_members"], kpis["official_members"])
        self.assertEqual(semester["active_rate"], kpis["active_members_pct"])
        self.assertEqual(payload["meta"]["as_of"], AS_OF.isoformat())

    def test_all_semesters_has_no_pooled_active_kpi(self):
        self.member("member", at("2025-01-01"), legacy_active=True)
        self.attend("member", at("2026-03-01"), "social")
        self.attend("member", at("2026-03-02"), "nonsocial")
        self.attend("member", at("2026-09-01"), "social")
        overview = self.payload()["overview"]
        self.assertIsNone(overview["kpis"]["active_members"])
        self.assertIsNone(overview["kpis"]["active_members_pct"])
        self.assertEqual([(r["value"], r["active_members"]) for r in overview["active_members_by_semester"]],
                         [("2026-fall", 0), ("2026-spring", 1)])

    def test_growth_timeline_contains_only_dated_registrations_through_snapshot(self):
        self.member("old", at("2025-09-01"), legacy_active=True)
        self.member("new-one", at("2026-09-01"))
        self.member("new-two", at("2026-10-01"))
        self.member("undated", None)
        self.member("future", AS_OF + DAY)
        rows = self.fall()["overview"]["members_over_time"]
        self.assertEqual(rows, [
            {"period": "2026-08", "registered_members_cumulative": 0},
            {"period": "2026-09", "registered_members_cumulative": 1},
            {"period": "2026-10", "registered_members_cumulative": 2},
            {"period": "2026-11", "registered_members_cumulative": 2},
        ])
        for row in rows:
            self.assertNotIn("active_members_cumulative", row)

    def test_rolling_growth_boundaries_exclude_future_registration(self):
        self.member("older", AS_OF - 60 * DAY - timedelta(seconds=1))
        self.member("previous-boundary", AS_OF - 60 * DAY)
        self.member("recent-boundary", AS_OF - 30 * DAY)
        self.member("now", AS_OF)
        self.member("future", AS_OF + timedelta(seconds=1))
        kpis = self.payload()["overview"]["kpis"]
        self.assertEqual(kpis["registered_last_30d"], 2)
        self.assertEqual(kpis["registered_previous_30d"], 1)
        self.assertEqual(kpis["registered_growth_last_30d_pct"], 100.0)
        self.assertEqual(kpis["official_members"], 4)

    def test_rolling_growth_is_clipped_at_selected_semester_end(self):
        self.member("prior-member", at("2026-01-01"))
        self.member("previous", at("2026-04-10"))
        self.member("recent", at("2026-05-10"))
        self.member("after-semester", at("2026-05-20"))
        kpis = self.payload(as_of=at("2026-05-31T12:00:00"),
                            semester_start=date(2026, 1, 15), semester_end=date(2026, 5, 16))["overview"]["kpis"]
        self.assertEqual(kpis["total_members"], 2)
        self.assertEqual(kpis["official_members"], 3)
        self.assertEqual(kpis["registered_last_30d"], 1)
        self.assertEqual(kpis["registered_previous_30d"], 1)
        self.assertEqual(kpis["registered_growth_last_30d_pct"], 0.0)

    def test_growth_at_semester_start_uses_na_for_empty_previous_period(self):
        self.member("before-semester", at("2026-08-15"))
        self.member("in-semester", at("2026-08-25"))
        kpis = self.fall(as_of=at("2026-09-10T12:00:00"))["overview"]["kpis"]
        self.assertEqual(kpis["registered_last_30d"], 1)
        self.assertEqual(kpis["registered_previous_30d"], 0)
        self.assertIsNone(kpis["registered_growth_last_30d_pct"])

    def test_undated_members_are_in_all_time_roster_but_not_historical_denominator(self):
        self.member("known", at("2026-09-01"))
        self.member("undated", None)
        self.member("future", AS_OF + DAY)
        self.assertEqual(self.payload()["overview"]["kpis"]["official_members"], 2)
        self.assertEqual(self.fall()["overview"]["kpis"]["official_members"], 1)

    def test_empty_overview_preserves_nullable_rates(self):
        payload = self.payload()
        kpis = payload["overview"]["kpis"]
        self.assertEqual(kpis["official_members"], 0)
        self.assertIsNone(kpis["registered_growth_last_30d_pct"])
        self.assertEqual(payload["overview"]["members_over_time"], [])
        self.assertIsNone(kpis["new_member_activation_30d"]["percentage"])
        self.assertIsNone(kpis["first_time_attendee_second_event"]["percentage"])


if __name__ == "__main__":
    unittest.main()
