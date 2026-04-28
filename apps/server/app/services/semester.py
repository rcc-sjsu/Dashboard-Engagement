"""
Shared semester utilities for analytics filtering.

Semester boundaries:
- Spring: Jan 15 (inclusive) to May 16 (exclusive)
- Fall:   Aug 20 (inclusive) to Dec 25 (exclusive)
"""

from __future__ import annotations

from datetime import date
from typing import Optional, TypedDict

from psycopg2.extensions import connection as Connection


class SemesterOption(TypedDict, total=False):
    value: str
    label: str
    start_date: str
    end_date: str


def _term_for_date(d: date) -> Optional[tuple[int, str]]:
    spring_start = date(d.year, 1, 15)
    spring_end_exclusive = date(d.year, 5, 16)
    fall_start = date(d.year, 8, 20)
    fall_end_exclusive = date(d.year, 12, 25)

    if spring_start <= d < spring_end_exclusive:
        return d.year, "spring"
    if fall_start <= d < fall_end_exclusive:
        return d.year, "fall"
    return None


def _bounds_for_term(year: int, term: str) -> tuple[date, date]:
    if term == "spring":
        return date(year, 1, 15), date(year, 5, 16)
    if term == "fall":
        return date(year, 8, 20), date(year, 12, 25)
    raise ValueError(f"Unsupported term '{term}'.")


def _semester_label(year: int, term: str) -> str:
    return f"{term.title()} {year}"


def _semester_sort_key(value: str) -> tuple[int, int]:
    year_str, term = value.split("-")
    year = int(year_str)
    # Fall should appear before Spring for the same year in desc order.
    term_rank = 1 if term == "fall" else 0
    return year, term_rank


def list_semester_options(
    conn: Connection,
    *,
    events_table: str = "public.events",
) -> list[SemesterOption]:
    sql = f"""
    SELECT DISTINCT DATE(starts_at) AS event_date
    FROM {events_table}
    WHERE starts_at IS NOT NULL
    ORDER BY event_date DESC;
    """

    with conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    values = set()
    for row in rows:
        event_date = row["event_date"]
        if event_date is None:
            continue
        term_parts = _term_for_date(event_date)
        if term_parts is None:
            continue
        year, term = term_parts
        values.add(f"{year}-{term}")

    sorted_values = sorted(values, key=_semester_sort_key, reverse=True)

    options: list[SemesterOption] = [
        {
            "value": "all",
            "label": "All Semesters",
        }
    ]

    for value in sorted_values:
        year_str, term = value.split("-")
        year = int(year_str)
        start_date, end_date = _bounds_for_term(year, term)
        options.append(
            {
                "value": value,
                "label": _semester_label(year, term),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            }
        )

    return options


def resolve_semester_window(
    conn: Connection,
    semester: Optional[str],
    *,
    events_table: str = "public.events",
) -> tuple[Optional[date], Optional[date], list[SemesterOption]]:
    options = list_semester_options(conn, events_table=events_table)

    if semester is None or semester == "" or semester == "all":
        return None, None, options

    for option in options:
        if option.get("value") == semester:
            start_raw = option.get("start_date")
            end_raw = option.get("end_date")
            if not start_raw or not end_raw:
                raise ValueError(f"Semester '{semester}' is missing date bounds.")
            return date.fromisoformat(start_raw), date.fromisoformat(end_raw), options

    raise ValueError(f"Invalid semester '{semester}'.")
