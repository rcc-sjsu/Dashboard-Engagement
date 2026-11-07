import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    id: "official-members",
    title: "Official members and membership terms",
    paragraphs: [
      "Member: Person submitted the RCC membership form. Non-member: Person appears in attendance data but is not in the membership roster.",
      "Not-yet-active member: A registered member who has not met the engagement requirement yet. Eligible non-member: A non-member who has enough engagement to qualify, but has not officially joined.",
      "Official member counts use distinct normalized roster emails. With one semester selected, include people who joined before the semester’s exclusive end and at or before the reporting snapshot, including people who joined in earlier semesters. This is the roster by that cutoff, rather than only new registrations during the semester.",
      "An undated registration cannot establish membership by a semester cutoff and is excluded from semester roster and active-rate calculations. The All Semesters official roster total can include undated registrations. A dated registration in the future is excluded.",
    ],
  },
  {
    id: "active-members",
    title: "Active Members by Semester",
    formula: "Active rate = active official members in the semester ÷ official members by that semester’s reporting cutoff × 100",
    paragraphs: [
      "Active member: An official RCC member who attended at least one social event and at least one non-social event during the same semester.",
      "Count each person once after both event requirements are met. Event categories must be recorded as social or non-social; an unclassified event does not satisfy either requirement. A social event in one semester and a non-social event in another do not combine to qualify someone.",
      "Qualifying attendance may precede registration, but the person must have officially joined by the semester’s reporting cutoff. A non-member who has both types of attendance is an eligible non-member and remains outside the active count and rate until they officially join.",
      "For a completed semester, consider registrations and attendance before its exclusive end. For an ongoing semester, consider only records through the current snapshot. Duplicate attendance and future events cannot add to qualification. N/A means there are no official members in the denominator.",
      "Selecting one semester shows its active count and rate together. All Semesters shows one row per semester because active status is assessed separately in each term; there is no pooled all-time active rate. These results are calculated from event attendance, rather than inferred from a lifetime active flag.",
    ],
  },
  {
    id: "registration-growth",
    title: "Registration Growth",
    formula: "Registration growth = (registrations in the recent 30 days − registrations in the preceding 30 days) ÷ registrations in the preceding 30 days × 100",
    paragraphs: [
      "The recent period runs from exactly 30 days before the reporting snapshot through the snapshot, including both endpoints. The previous period runs from 60 days before the snapshot up to, but excluding, the recent period’s start. Each registration is counted in only one period.",
      "When a semester is selected, clip both registration periods to that semester. The comparison still ends at today’s snapshot; it does not move to the last day of a historical semester. An older semester can therefore have no registrations in either comparison period.",
      "A zero previous count makes percentage growth undefined, so the dashboard displays N/A. Missing registration dates cannot be assigned to either period. Future registrations are excluded.",
    ],
  },
  {
    id: "activation",
    title: "30-Day New-Member Activation Rate",
    formula: "Activation rate = eligible members who attended within 30 days of joining ÷ eligible members × 100",
    paragraphs: [
      "Eligible members registered at least 30 days ago. Members are counted as activated if they attended at least one event within 30 days of registration. Members without an event opportunity are excluded.",
      "The measurement window starts at the registration timestamp and ends exactly 30 days later, including both endpoints. The entire window must have elapsed by the reporting snapshot, even if the member already attended an event. Attendance before registration does not count toward activation.",
      "An event opportunity means at least one recorded RCC event occurred during that member’s 30-day window. It can be social or non-social and is an opportunity even if no attendance records were uploaded for it. A member with no recorded event opportunity is excluded from both eligible and activated counts.",
      "The selected semester chooses members by their registration date. Their follow-up window can continue beyond the semester’s end. All Semesters includes all completed registration cohorts that meet the same eligibility rules. The card displays successful and eligible counts alongside the percentage; zero eligible members produces N/A and 0 of 0 eligible members.",
      "Opportunity is inferred from the recorded event calendar. An omitted event can change eligibility, and missing attendance can change the activated count. This metric does not establish whether an individual received an invitation or could personally attend.",
    ],
  },
  {
    id: "second-event",
    title: "First-Time Attendee Second-Event Rate",
    formula: "Second-event rate = first-time attendees who attended a later distinct event by the snapshot ÷ first-time attendees in the cohort × 100",
    paragraphs: [
      "The population includes members and non-members. Find each person’s first recorded event across all available attendance history before applying a semester filter. With a semester selected, include people whose first recorded event occurred during that semester.",
      "A success means attending a distinct event with a later start time than the first event, at any point through the reporting snapshot. The second event can occur in a later semester. Duplicate attendance rows for the first event do not count as a second event.",
      "There is no fixed follow-up deadline and no minimum waiting period. All first-time attendees in the cohort are in the denominator, including recent attendees and those with no later event opportunity. Zero first-time attendees produces N/A and 0 of 0 eligible attendees.",
      "Follow-up duration varies: an older attendee has had more time to attend again than a recent attendee. Treat current-semester results as developing outcomes and use care when comparing them with older cohorts. Historical cohort results can increase when someone attends a second event later.",
      "First-time means first recorded attendance. Missing historical event imports can make a returning person appear new, while missing subsequent attendance can lower the second-event rate.",
    ],
  },
  {
    id: "member-growth",
    title: "Member Growth Over Time",
    paragraphs: [
      "The line chart shows cumulative registrations by month. All Semesters accumulates dated registrations from the earliest recorded joining date through the reporting snapshot. A selected semester accumulates only registrations made within that semester.",
      "Registrations with no joining date cannot be placed on the timeline. The current month is incomplete. The chart shows registration growth only; semester active-member history appears in Active Members by Semester.",
    ],
  },
  {
    id: "attendance-frequency",
    title: "Attendance Frequency",
    paragraphs: [
      "The population combines every registered member with known non-member attendees in the selected event period, deduplicated by normalized email. Count distinct event IDs attended by each person and group them into 0, 1, 2, 3, and 4+ events.",
      "With a semester selected, count attendance at events within that semester. Every registered member remains in the population, so the 0-event bucket includes members with no attendance in that period. All Semesters uses all recorded attendance.",
      "The major-category view uses the member’s category when available, otherwise the attendance record’s category. Missing categories are shown as Other/Unknown. This chart describes how often people attended; it does not apply the activation or second-event eligibility rules.",
    ],
  },
  {
    id: "mission-demographics",
    title: "Members by Major Category and Class Year",
    paragraphs: [
      "All Semesters shows the demographic distribution of the registered roster. When a semester is selected, include registered members who attended at least one event during that semester, regardless of when they registered.",
      "Non-members are excluded from these member-demographic charts. Each included member contributes to the category or class year recorded in their member profile; missing values appear in the unknown category.",
    ],
  },
  {
    id: "event-diversity",
    title: "Event Diversity by Major",
    paragraphs: [
      "This chart includes all attendees, including non-members, at up to 10 events with the highest attendance in the selected period. With All Semesters selected, the events are chosen from all recorded events with attendance.",
      "Each bar represents one event and shows counts by major category. Event attendance is counted by distinct attendee email. A person who attends several events can appear in several bars. Member major information is used when linked; otherwise the attendance record provides the category, with unknown values grouped as Other/Unknown.",
    ],
  },
];

export default function MethodologyPage() {
  return (
    <main className="flex w-full flex-1 flex-col px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="space-y-3">
          <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-semibold sm:text-3xl">Metric methodology</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Population, eligibility, and calculation details for RCC engagement metrics.
            Definitions reflect the semester membership rule confirmed on November 6, 2026.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Periods and shared counting rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Spring runs January 15 through May 15, inclusive. Fall runs August 20 through
              December 24, inclusive. Calculations use exclusive end boundaries of May 16
              and December 25. Dates outside these terms are available in All Semesters.
            </p>
            <p>
              Eligibility uses the database snapshot when the report is requested. Snapshot
              timestamps are reported in UTC; semester date comparisons use the database
              timezone. Activation, second-event, and active-member KPIs exclude future events.
            </p>
            <p>
              Engagement KPIs identify people by trimmed, lowercased email, preferring a linked
              member email and otherwise using the attendee email. Missing identities and
              missing dates needed to establish a cohort are excluded. Attendance uses event
              start times, so a missing check-in timestamp does not discard valid attendance.
              Percentages are rounded to one decimal place; N/A means a percentage cannot
              be calculated from the available denominator.
            </p>
          </CardContent>
        </Card>

        <nav aria-label="Metric methodology sections" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="text-primary underline-offset-4 hover:underline">
              {section.title}
            </a>
          ))}
        </nav>

        {sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24">
            <Card>
              <CardHeader>
                <CardTitle><h2 id={`${section.id}-title`}>{section.title}</h2></CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                {section.formula ? <p className="rounded-lg bg-muted p-3 font-medium text-foreground">{section.formula}</p> : null}
                {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </CardContent>
            </Card>
          </section>
        ))}
      </div>
    </main>
  );
}
