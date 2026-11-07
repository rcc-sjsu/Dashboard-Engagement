"""Active-membership SQL integration tests using isolated temporary tables."""

import os
import unittest
from datetime import date, datetime, timezone

import psycopg2
from psycopg2.extras import RealDictCursor

from app.services.active_membership import build_active_membership_payload


AS_OF = datetime(2026, 11, 6, 12, tzinfo=timezone.utc)


def at(iso_date):
    return datetime.fromisoformat(iso_date).replace(tzinfo=timezone.utc)


@unittest.skipUnless(os.environ.get("TEST_DATABASE_URL"), "Set TEST_DATABASE_URL to an isolated test database")
class ActiveMembershipTests(unittest.TestCase):
    def setUp(self):
        self.conn = psycopg2.connect(os.environ["TEST_DATABASE_URL"], cursor_factory=RealDictCursor)
        self.addCleanup(self.conn.close)
        with self.conn.cursor() as cur:
            cur.execute("""
                SET TIME ZONE 'UTC';
                CREATE TEMP TABLE active_test_members (email text, joined_at timestamptz);
                CREATE TEMP TABLE active_test_events (
                    id int PRIMARY KEY, starts_at timestamptz, event_kind text
                );
                CREATE TEMP TABLE active_test_attendance (
                    event_id int, attendee_email text, member_email text
                );
            """)
        self.next_event_id = 1

    def member(self, email, joined_at):
        with self.conn.cursor() as cur:
            cur.execute("INSERT INTO active_test_members VALUES (%s, %s)", (email, joined_at))

    def attend(self, email, starts_at, kind, *, linked_email=None, duplicate=False):
        event_id = self.next_event_id
        self.next_event_id += 1
        with self.conn.cursor() as cur:
            cur.execute("INSERT INTO active_test_events VALUES (%s, %s, %s)", (event_id, starts_at, kind))
            for _ in range(2 if duplicate else 1):
                cur.execute("INSERT INTO active_test_attendance VALUES (%s, %s, %s)",
                            (event_id, email, linked_email))

    def payload(self, **kwargs):
        return build_active_membership_payload(
            self.conn, members_table="active_test_members",
            attendance_table="active_test_attendance", events_table="active_test_events",
            as_of=AS_OF, **kwargs,
        )

    def fall(self):
        return self.payload(semester_start=date(2026, 8, 20), semester_end=date(2026, 12, 25))["selected_semester"]

    def test_requires_both_event_kinds_in_the_same_semester(self):
        for email in ("both", "social-only", "split", "no-attendance"):
            self.member(email, at("2026-01-01"))
        self.attend("both", at("2026-09-01"), "social")
        self.attend("both", at("2026-09-02"), "nonsocial")
        self.attend("social-only", at("2026-09-01"), "social")
        self.attend("social-only", at("2026-09-02"), "social")
        self.attend("split", at("2026-03-01"), "social")
        self.attend("split", at("2026-09-01"), "nonsocial")
        row = self.fall()
        self.assertEqual((row["official_members"], row["active_members"], row["active_rate"]), (4, 1, 25.0))

    def test_nonmembers_are_not_active_and_prior_members_are_in_denominator(self):
        self.member("old-member", at("2024-01-01"))
        self.member("new-member", at("2026-09-01"))
        for email in ("old-member", "guest"):
            self.attend(email, at("2026-09-02"), "social")
            self.attend(email, at("2026-09-03"), "nonsocial")
        row = self.fall()
        self.assertEqual((row["official_members"], row["active_members"], row["active_rate"]), (2, 1, 50.0))

    def test_pre_registration_attendance_counts_after_joining_in_same_semester(self):
        self.member("joins-later", at("2026-10-01"))
        self.attend("joins-later", at("2026-09-01"), "social")
        self.attend("joins-later", at("2026-09-02"), "nonsocial")
        self.assertEqual(self.fall()["active_members"], 1)

    def test_historical_denominator_excludes_later_registrations(self):
        self.member("registered-before-end", at("2026-05-15T23:59:59"))
        self.member("registered-at-end", at("2026-05-16"))
        self.member("registered-in-fall", at("2026-09-01"))
        for email in ("registered-before-end", "registered-at-end", "registered-in-fall"):
            self.attend(email, at("2026-03-01"), "social")
            self.attend(email, at("2026-03-02"), "nonsocial")
        row = self.payload(semester_start=date(2026, 1, 15), semester_end=date(2026, 5, 16))["selected_semester"]
        self.assertEqual((row["official_members"], row["active_members"], row["active_rate"]), (1, 1, 100.0))

    def test_future_attendance_and_registrations_do_not_count(self):
        self.member("future-event", at("2026-09-01"))
        self.member("future-member", at("2026-11-07"))
        self.member("at-snapshot", AS_OF)
        for email in ("future-event", "future-member", "at-snapshot"):
            self.attend(email, at("2026-09-01"), "social")
        self.attend("future-event", at("2026-11-07"), "nonsocial")
        self.attend("future-member", at("2026-09-02"), "nonsocial")
        self.attend("at-snapshot", AS_OF, "nonsocial")
        row = self.fall()
        self.assertEqual((row["official_members"], row["active_members"]), (2, 1))

    def test_semester_boundaries_and_unknown_event_kind(self):
        self.member("boundary", at("2026-01-01"))
        self.member("unknown-kind", at("2026-01-01"))
        self.attend("boundary", at("2026-08-19T23:59:59"), "social")
        self.attend("boundary", at("2026-08-20"), "nonsocial")
        self.attend("unknown-kind", at("2026-09-01"), "social")
        self.attend("unknown-kind", at("2026-09-02"), None)
        self.assertEqual(self.fall()["active_members"], 0)
        self.attend("boundary", at("2026-08-20"), "social")
        self.assertEqual(self.fall()["active_members"], 1)

    def test_identity_normalization_linking_and_duplicates(self):
        self.member(" MEMBER@example.com ", at("2026-01-01"))
        self.member("member@example.com", at("2026-02-01"))
        self.attend("alias@example.com", at("2026-09-01"), "social", linked_email="MEMBER@example.com", duplicate=True)
        self.attend(" member@example.com ", at("2026-09-02"), " NONSOCIAL ", linked_email=" ")
        row = self.fall()
        self.assertEqual((row["official_members"], row["active_members"], row["active_rate"]), (1, 1, 100.0))

    def test_missing_registration_dates_are_disclosed_and_excluded(self):
        self.member("missing", None)
        self.member("known", None)
        self.member("known", at("2026-09-01"))
        self.member(" ", at("2026-09-01"))
        for email in ("missing", "known"):
            self.attend(email, at("2026-09-02"), "social")
            self.attend(email, at("2026-09-03"), "nonsocial")
        payload = self.payload(semester_start=date(2026, 8, 20), semester_end=date(2026, 12, 25))
        self.assertEqual(payload["members_without_registration_date"], 1)
        self.assertEqual(payload["selected_semester"]["official_members"], 1)
        self.assertEqual(payload["selected_semester"]["active_members"], 1)

    def test_all_semesters_return_separate_rows_and_no_pooled_total(self):
        self.member("member", at("2025-01-01"))
        for starts_at, kind in (("2026-03-01", "social"), ("2026-03-02", "nonsocial"), ("2026-09-01", "social")):
            self.attend("member", at(starts_at), kind)
        payload = self.payload()
        self.assertIsNone(payload["selected_semester"])
        self.assertEqual([row["value"] for row in payload["semesters"]], ["2026-fall", "2026-spring"])
        self.assertEqual([row["active_members"] for row in payload["semesters"]], [0, 1])
        self.assertNotIn("active_members", payload)

    def test_selected_semester_without_events_returns_zero(self):
        row = self.fall()
        self.assertEqual(row["label"], "Fall 2026")
        self.assertEqual((row["official_members"], row["active_members"], row["active_rate"]), (0, 0, None))
        self.member("member", at("2026-01-01"))
        row = self.fall()
        self.assertEqual((row["official_members"], row["active_members"], row["active_rate"]), (1, 0, 0.0))

    def test_empty_all_semesters_and_invalid_bounds(self):
        self.assertEqual(self.payload()["semesters"], [])
        with self.assertRaises(ValueError):
            self.payload(semester_start=date(2026, 8, 20))
        with self.assertRaises(ValueError):
            self.payload(semester_start=date(2026, 1, 1), semester_end=date(2026, 12, 31))

    def test_all_semesters_excludes_terms_with_only_future_events(self):
        self.member("member", at("2026-08-01"))
        self.attend("member", at("2026-11-07"), "social")
        self.attend("member", at("2027-03-01"), "nonsocial")
        self.assertEqual(self.payload()["semesters"], [])


if __name__ == "__main__":
    unittest.main()
