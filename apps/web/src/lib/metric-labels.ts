export const ACTIVE_MEMBER_DEFINITION =
  "An official RCC member who attended at least one social event and at least one non-social event during the same semester.\nThe active rate is the percentage of official members registered by the semester’s cutoff who met both requirements. Members who joined in earlier semesters are included.\nEach semester is calculated separately. Qualifying non-members are excluded until they officially join; registrations without a known date are excluded from semester calculations.";

export const ACTIVATION_DEFINITION =
  "Eligible members registered at least 30 days ago.\nMembers are counted as activated if they attended at least one event within 30 days of registration.\nMembers without an event opportunity are excluded. An opportunity is a recorded RCC event during their 30-day window, even if they did not attend it.\nThe selected semester determines when members registered. Their 30-day follow-up can extend into another semester.";

export const SECOND_EVENT_DEFINITION =
  "First-time attendees are people whose first recorded event falls in the selected period, including members and non-members. All Semesters includes all recorded history.\nThey are counted as successful if they attended a later event by the reporting date, including in a later semester. There is no fixed day limit.\nAll first-time attendees in the cohort are included, even recent attendees or people with no later event opportunity yet. Follow-up time varies, so recent cohorts may have lower rates.\nFirst-time status is based on all recorded attendance history before the semester filter is applied.";

// API dates are ISO calendar dates; keep them independent of the browser timezone.
export function dateRangeLabel(start?: string | null, end?: string | null) {
  if (start && end) return `${start} – ${end}`;
  if (end) return `All time through ${end}`;
  return "All time (no dated records)";
}

export function semesterPeriodLabel(option?: {
  label: string;
  start_date?: string;
  end_date?: string;
}) {
  if (!option?.start_date || !option.end_date) return "All time";
  const inclusiveEnd = new Date(`${option.end_date}T00:00:00Z`);
  inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() - 1);
  return `${option.label} (${option.start_date} – ${inclusiveEnd.toISOString().slice(0, 10)})`;
}

export type EngagementMetric = {
  percentage: number | null;
  successful: number;
  eligible: number;
  window_days: number | null;
  excluded_no_opportunity?: number;
};
