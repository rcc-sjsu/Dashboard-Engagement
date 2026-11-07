"""SQL integration tests using only temporary tables in an explicit test database.

Run from apps/server:
TEST_DATABASE_URL='...' .venv/bin/python -m unittest discover -s tests -v
Never loads the application .env or changes application tables.
"""

import os
import unittest
from datetime import date, datetime, timedelta, timezone

import psycopg2
from psycopg2.extras import RealDictCursor

from app.services.engagement import build_engagement_kpis
from app.services.overview import build_overview_payload
from app.services.retention import build_retention_payload

AS_OF = datetime(2026, 10, 29, 12, tzinfo=timezone.utc)
DAY = timedelta(days=1)


@unittest.skipUnless(os.environ.get("TEST_DATABASE_URL"), "Set TEST_DATABASE_URL to an isolated test database")
class EngagementTests(unittest.TestCase):
    def setUp(self):
        self.conn = psycopg2.connect(os.environ["TEST_DATABASE_URL"], cursor_factory=RealDictCursor)
        self.addCleanup(self.conn.close)
        with self.conn.cursor() as cur:
            cur.execute("""
                CREATE TEMP TABLE test_members (
                    email text, joined_at timestamptz, major_category text,
                    is_active_member boolean DEFAULT false, active_member_start_date timestamptz
                );
                CREATE TEMP TABLE test_events (
                    id int PRIMARY KEY, starts_at timestamptz,
                    event_kind text DEFAULT 'social'
                );
                CREATE TEMP TABLE test_attendance (
                    event_id int, attendee_email text, member_email text,
                    attendee_major_category text
                );
            """)
        self.next_id = 1

    def member(self, email, joined):
        with self.conn.cursor() as cur:
            cur.execute("INSERT INTO test_members (email, joined_at) VALUES (%s, %s)", (email, joined))

    def event(self, when):
        event_id = self.next_id
        self.next_id += 1
        with self.conn.cursor() as cur:
            cur.execute("INSERT INTO test_events (id, starts_at) VALUES (%s, %s)", (event_id, when))
        return event_id

    def attend(self, email, when, *, member_email=None, duplicate=False):
        event_id = self.event(when)
        with self.conn.cursor() as cur:
            for _ in range(2 if duplicate else 1):
                cur.execute("INSERT INTO test_attendance (event_id, attendee_email, member_email) VALUES (%s, %s, %s)",
                            (event_id, email, member_email))

    def metrics(self, **kwargs):
        return build_engagement_kpis(
            self.conn, members_table="test_members", attendance_table="test_attendance",
            events_table="test_events", as_of=AS_OF, **kwargs,
        )

    def assert_metric(self, result, name, successful, eligible):
        self.assertEqual(result[name]["successful"], successful)
        self.assertEqual(result[name]["eligible"], eligible)
        expected = round(100 * successful / eligible, 1) if eligible else None
        self.assertEqual(result[name]["percentage"], expected)

    def test_empty_cohorts_are_undefined(self):
        result = self.metrics()
        self.assert_metric(result, "new_member_activation_30d", 0, 0)
        self.assert_metric(result, "first_time_attendee_second_event", 0, 0)
        self.assertEqual(result["new_member_activation_30d"]["window_days"], 30)
        self.assertIsNone(result["first_time_attendee_second_event"]["window_days"])
        self.assertNotIn("first_time_attendee_return_60d", result)
        self.assertEqual(result["as_of"], AS_OF.isoformat())

    def test_activation_clock_and_inclusive_deadline(self):
        for email in ["before", "exact", "late", "absent"]:
            self.member(email, AS_OF - 100 * DAY)
        self.attend("before", AS_OF - 101 * DAY)
        self.attend("exact", AS_OF - 70 * DAY)
        self.attend("late", AS_OF - 70 * DAY + timedelta(seconds=1))
        self.assert_metric(self.metrics(), "new_member_activation_30d", 1, 4)

    def test_activation_requires_complete_window_but_second_event_has_no_wait(self):
        self.member("recent", AS_OF - 29 * DAY)
        self.attend("recent", AS_OF - 28 * DAY)
        self.attend("recent", AS_OF - 27 * DAY)
        result = self.metrics()
        self.assert_metric(result, "new_member_activation_30d", 0, 0)
        self.assert_metric(result, "first_time_attendee_second_event", 1, 1)

    def test_exact_activation_eligibility_and_snapshot_boundary(self):
        self.member("member", AS_OF - 30 * DAY)
        self.attend("member", AS_OF)
        self.attend("nonmember", AS_OF - 60 * DAY)
        self.attend("nonmember", AS_OF)
        result = self.metrics()
        self.assert_metric(result, "new_member_activation_30d", 1, 1)
        # A person whose first event is at the snapshot is already in the cohort.
        self.assert_metric(result, "first_time_attendee_second_event", 1, 2)

    def test_second_event_can_be_after_60_days_but_duplicates_do_not_count(self):
        self.attend("duplicate", AS_OF - 100 * DAY, duplicate=True)
        self.attend("late", AS_OF - 100 * DAY)
        self.attend("late", AS_OF - 10 * DAY)
        self.attend("returns", AS_OF - 100 * DAY)
        self.attend("returns", AS_OF - 41 * DAY)
        self.assert_metric(self.metrics(), "first_time_attendee_second_event", 2, 3)

    def test_identity_normalization_and_linked_member_email(self):
        self.member(" MEMBER@EXAMPLE.COM ", AS_OF - 100 * DAY)
        self.member("member@example.com", AS_OF - 90 * DAY)
        self.attend("alias@example.com", AS_OF - 99 * DAY, member_email="member@example.com")
        self.attend(" MEMBER@example.com ", AS_OF - 80 * DAY)
        self.attend("guest", AS_OF - 100 * DAY, member_email="   ")
        self.attend(" GUEST ", AS_OF - 90 * DAY)
        result = self.metrics()
        self.assert_metric(result, "new_member_activation_30d", 1, 1)
        self.assert_metric(result, "first_time_attendee_second_event", 2, 2)

    def test_missing_identities_dates_and_future_events_excluded(self):
        self.member(" ", AS_OF - 100 * DAY)
        self.member("missing-date", None)
        self.member("future", AS_OF + DAY)
        self.attend(None, AS_OF - 100 * DAY)
        self.attend(" ", AS_OF - 100 * DAY)
        self.attend("no-date", None)
        self.attend("future-return", AS_OF - 100 * DAY)
        self.attend("future-return", AS_OF + DAY)
        self.attend("future-first", AS_OF + DAY)
        result = self.metrics()
        self.assert_metric(result, "new_member_activation_30d", 0, 0)
        self.assert_metric(result, "first_time_attendee_second_event", 0, 1)

    def test_activation_excludes_members_without_event_opportunity(self):
        self.member("no-opportunity", AS_OF - 100 * DAY)
        self.member("opportunity-only", AS_OF - 60 * DAY)
        # No attendance is necessary for this event to be an opportunity.
        self.event(AS_OF - 50 * DAY)
        result = self.metrics()
        self.assert_metric(result, "new_member_activation_30d", 0, 1)
        self.assertEqual(result["new_member_activation_30d"]["excluded_no_opportunity"], 1)

    def test_events_outside_activation_window_are_not_opportunities(self):
        self.member("no-opportunity", AS_OF - 100 * DAY)
        self.event(AS_OF - 100 * DAY - timedelta(seconds=1))
        self.event(AS_OF - 70 * DAY + timedelta(seconds=1))
        self.event(AS_OF + DAY)
        self.event(None)
        result = self.metrics()
        self.assert_metric(result, "new_member_activation_30d", 0, 0)
        self.assertEqual(result["new_member_activation_30d"]["excluded_no_opportunity"], 1)

    def test_second_event_includes_attendees_without_a_later_opportunity(self):
        self.attend("newest", AS_OF)
        self.assert_metric(self.metrics(), "first_time_attendee_second_event", 0, 1)

    def test_second_event_must_be_later_than_first_event(self):
        self.attend("simultaneous", AS_OF - DAY)
        self.attend("simultaneous", AS_OF - DAY)
        self.assert_metric(self.metrics(), "first_time_attendee_second_event", 0, 1)

    def test_semester_selects_anchors_and_preserves_follow_up(self):
        self.member("new", datetime(2026, 5, 15, tzinfo=timezone.utc))
        self.attend("new", datetime(2026, 5, 20, tzinfo=timezone.utc))
        self.attend("guest", datetime(2026, 5, 15, tzinfo=timezone.utc))
        self.attend("guest", datetime(2026, 6, 1, tzinfo=timezone.utc))
        # A spring attendee with an earlier event is not first-time in spring.
        self.attend("old", datetime(2025, 12, 1, tzinfo=timezone.utc))
        self.attend("old", datetime(2026, 3, 1, tzinfo=timezone.utc))
        # Semester end is exclusive, start is inclusive.
        self.member("end", datetime(2026, 5, 16, tzinfo=timezone.utc))
        self.member("start", datetime(2026, 1, 15, tzinfo=timezone.utc))
        self.event(datetime(2026, 1, 15, tzinfo=timezone.utc))
        result = self.metrics(semester_start=date(2026, 1, 15), semester_end=date(2026, 5, 16))
        self.assert_metric(result, "new_member_activation_30d", 1, 2)
        self.assert_metric(result, "first_time_attendee_second_event", 1, 1)

    def test_second_event_can_happen_in_a_later_semester(self):
        self.attend("spring-first", datetime(2026, 4, 1, tzinfo=timezone.utc))
        self.attend("spring-first", datetime(2026, 9, 1, tzinfo=timezone.utc))
        result = self.metrics(semester_start=date(2026, 1, 15), semester_end=date(2026, 5, 16))
        self.assert_metric(result, "first_time_attendee_second_event", 1, 1)
        fall = self.metrics(semester_start=date(2026, 8, 20), semester_end=date(2026, 12, 25))
        self.assert_metric(fall, "first_time_attendee_second_event", 0, 0)

    def test_registration_and_first_event_are_separate_anchors(self):
        self.member("member", AS_OF - 100 * DAY)
        self.attend("member", AS_OF - 80 * DAY)
        self.attend("member", AS_OF - 25 * DAY)
        result = self.metrics()
        self.assert_metric(result, "new_member_activation_30d", 1, 1)
        self.assert_metric(result, "first_time_attendee_second_event", 1, 1)

    def test_overview_includes_kpis(self):
        self.member("member", datetime(2000, 1, 1, tzinfo=timezone.utc))
        payload = build_overview_payload(
            self.conn, members_table="test_members", attendance_table="test_attendance", events_table="test_events",
        )
        self.assertEqual(payload["overview"]["kpis"]["total_members"], 1)
        self.assert_metric(payload["overview"]["kpis"], "new_member_activation_30d", 0, 0)
        self.assert_metric(payload["overview"]["kpis"], "first_time_attendee_second_event", 0, 0)
        self.assertIn("as_of", payload["meta"])

    def test_frequency_preserves_zero_attendance_members_and_metadata(self):
        self.member("zero", AS_OF - 100 * DAY)
        self.attend("guest", AS_OF - DAY)
        payload = build_retention_payload(
            self.conn, members_table="test_members", attendance_table="test_attendance", events_table="test_events",
        )
        counts = {r["events_attended_bucket"]: r["people"] for r in payload["retention"]["attendance_count_distribution_overall"]}
        self.assertEqual(counts["0"], 1)
        self.assertEqual(counts["1"], 1)
        self.assertEqual(payload["meta"]["start"], (AS_OF - 100 * DAY).date().isoformat())
        filtered = build_retention_payload(
            self.conn, members_table="test_members", attendance_table="test_attendance", events_table="test_events",
            semester_start=date(2026, 8, 20), semester_end=date(2026, 12, 25),
        )
        self.assertEqual(filtered["meta"], {"start": "2026-08-20", "end": "2026-12-24"})


if __name__ == "__main__":
    unittest.main()
