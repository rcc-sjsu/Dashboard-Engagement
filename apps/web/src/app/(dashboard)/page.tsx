import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ChartLineMultiple } from "@/components/ui/line-graph";
import { BigNumber } from "@/components/ui/kpi";
import { RetentionDistributionChart } from "@/components/ui/retention/retention-distribution";
import { MissionSection } from "@/components/ui/mission/MissionSection";
import { authenticatedServerFetch } from "@/lib/api-client";
import { SemesterFilter } from "@/components/dashboard/semester-filter";
import { ActiveMembersBySemester } from "@/components/dashboard/active-members-by-semester";
import {
  KPICardsSkeleton,
  ChartSkeleton,
  MissionSectionSkeleton,
  RetentionChartSkeleton,
} from "@/components/dashboard/skeletons";
import { ACTIVE_MEMBER_DEFINITION, ACTIVATION_DEFINITION, SECOND_EVENT_DEFINITION, dateRangeLabel, semesterPeriodLabel, type EngagementMetric } from "@/lib/metric-labels";
// Type definitions for API responses
interface AnalyticsOverview {
  overview?: {
    kpis?: {
      total_members?: number;
      official_members?: number;
      active_members?: number | null;
      active_members_pct?: number | null;
      registered_growth_last_30d_pct?: number | null;
      registered_last_30d?: number;
      registered_previous_30d?: number;
      new_member_activation_30d?: EngagementMetric;
      first_time_attendee_second_event?: EngagementMetric;
    };
    active_members_by_semester?: Array<{
      value: string;
      label: string;
      official_members: number;
      active_members: number;
      active_rate: number | null;
    }>;
    members_over_time?: Array<{
      period: string;
      registered_members_cumulative: number;
    }>;
  };
  meta?: {
    start?: string;
    end?: string;
    as_of?: string;
    selected_semester?: string;
    semester_options?: SemesterOption[];
  };
}

interface MissionResponse {
  mission?: {
    major_category_distribution?: Array<any>;
    class_year_distribution?: Array<any>;
    event_major_category_percent?: Array<any>;
  };
  major_category_distribution?: Array<any>;
  class_year_distribution?: Array<any>;
  event_major_category_percent?: Array<any>;
  [key: string]: any;
}

interface RetentionResponse {
  retention?: {
    retention?: Record<string, any>;
  };
  [key: string]: any;
}

interface SemesterOption {
  value: string;
  label: string;
  start_date?: string;
  end_date?: string;
}

interface SemesterOptionsResponse {
  semester_options?: SemesterOption[];
}

function buildAnalyticsEndpoint(endpoint: string, semester: string) {
  if (semester === "all") {
    return endpoint;
  }
  return `${endpoint}?semester=${encodeURIComponent(semester)}`;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{
    semester?: string | string[];
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/signin");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawSemester = resolvedSearchParams?.semester;
  const selectedSemester =
    (Array.isArray(rawSemester) ? rawSemester[0] : rawSemester)?.trim() || "all";
  const semesterJson = await authenticatedServerFetch<SemesterOptionsResponse>(
    "/api/analytics/semesters",
  );
  const semesterOptions = semesterJson?.semester_options ?? [
    { value: "all", label: "All Semesters" },
  ];
  const periodLabel = semesterPeriodLabel(
    semesterOptions.find((option) => option.value === selectedSemester),
  );
  const semesterLabel = semesterOptions.find((option) => option.value === selectedSemester)?.label ?? "All Semesters";

  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 lg:px-10 xl:px-12">
      <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold sm:text-3xl">
              RCC Engagement Dashboard
            </h1>
            <SemesterFilter options={semesterOptions} value={selectedSemester} />
          </div>
          <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <h3 className="font-medium sm:text-base">Overview & Growth</h3>
            <Link href="/methodology" className="underline underline-offset-4">Metric methodology</Link>
          </div>
        </div>

        {/* KPI CARDS */}
        <Suspense fallback={<KPICardsSkeleton />} key={`kpi-${selectedSemester}`}>
          <KPICardsSection semester={selectedSemester} semesterLabel={semesterLabel} periodLabel={periodLabel} />
        </Suspense>

        {/* LINE CHART */}
        <Suspense fallback={<ChartSkeleton />} key={`chart-${selectedSemester}`}>
          <OverviewChartSection semester={selectedSemester} />
        </Suspense>

        {/* MISSION SECTION */}
        <Suspense fallback={<MissionSectionSkeleton />} key={`mission-${selectedSemester}`}>
          <MissionSectionWrapper semester={selectedSemester} periodLabel={periodLabel} />
        </Suspense>

        {/* RETENTION SECTION */}
        <Suspense fallback={<RetentionChartSkeleton />} key={`retention-${selectedSemester}`}>
          <RetentionChartSection semester={selectedSemester} />
        </Suspense>
      </div>
    </main>
  );
}

async function KPICardsSection({ semester, semesterLabel, periodLabel }: { semester: string; semesterLabel: string; periodLabel: string }) {
  try {
    const json = await authenticatedServerFetch<AnalyticsOverview>(
      buildAnalyticsEndpoint("/api/analytics/overview", semester),
    );
    const kpis = json?.overview?.kpis ?? {};

    const activePct = kpis.active_members_pct;
    const growthPct = kpis.registered_growth_last_30d_pct;
    const activation = kpis.new_member_activation_30d;
    const secondEvent = kpis.first_time_attendee_second_event;
    const snapshotNote = json.meta?.as_of ? `\nReporting date: ${json.meta.as_of.slice(0, 10)} (UTC).` : "";
    const cohortNote = `\nCohort period: ${periodLabel}.`;
    const activeRows = json.overview?.active_members_by_semester ?? [];

    return (
      <div className="flex flex-col gap-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <BigNumber
            title="Official Members"
            date={`Registered members · ${semesterLabel}`}
            value={kpis.official_members ?? "N/A"}
            summary="People who submitted the RCC membership form."
            definition={`Official members are identified by the membership roster. ${semester === "all" ? "This is the current roster, including members whose registration date is unknown." : "This includes members registered by the semester cutoff, including those who joined in earlier semesters. Unknown registration dates are excluded because membership at that time cannot be established."}${cohortNote}${snapshotNote}`}
            methodologyHref="/methodology#official-members"
            trending={false}
          />
          <BigNumber
            title="Registered Growth"
            date={`Registered members · Last 30 days${semester !== "all" ? ` · ${semesterLabel}` : ""}`}
            value={growthPct != null ? `${growthPct.toFixed(1)}%` : "N/A"}
            detail={`${kpis.registered_last_30d ?? 0} recent · ${kpis.registered_previous_30d ?? 0} previous`}
            summary="Change in registrations versus the previous 30 days."
            definition={`Compares registrations in the last 30 days with the preceding 30 days. Both windows end relative to the reporting date and are restricted to the selected semester when one is selected.\nThe rate is N/A when the previous window has no registrations.${cohortNote}${snapshotNote}`}
            methodologyHref="/methodology#registration-growth"
            trending={false}
          />
          {semester === "all" ? (
            <ActiveMembersBySemester
              rows={activeRows.map((row) => ({ ...row, semester: row.value }))}
              definition={`${ACTIVE_MEMBER_DEFINITION}${snapshotNote}`}
              methodologyHref="/methodology#active-members"
            />
          ) : (
            <BigNumber
              title={`Active Members — ${semesterLabel}`}
              date="Official RCC members"
              value={kpis.active_members ?? "N/A"}
              valueSuffix="members active"
              detail={activePct != null ? `${activePct.toFixed(1)}% of official members` : "N/A · No official members in this semester"}
              summary="Attended a social event and a non-social event this semester."
              definition={`${ACTIVE_MEMBER_DEFINITION}${cohortNote}${snapshotNote}`}
              methodologyHref="/methodology#active-members"
              trending={false}
            />
          )}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <BigNumber
            title="30-Day Activation"
            definitionTitle="30-Day New-Member Activation Rate"
            date={`New members · ${semesterLabel}`}
            value={activation?.percentage != null ? `${activation.percentage.toFixed(1)}%` : "N/A"}
            detail={activation ? `${activation.successful.toLocaleString()} of ${activation.eligible.toLocaleString()} eligible members` : "Engagement data unavailable"}
            summary="New members who attended an event within 30 days of joining."
            definition={`${ACTIVATION_DEFINITION}${cohortNote}${snapshotNote}${activation?.excluded_no_opportunity != null ? `\n${activation.excluded_no_opportunity.toLocaleString()} members with completed windows excluded because no event opportunity was recorded.` : ""}`}
            methodologyHref="/methodology#activation"
            trending={false}
          />
          <BigNumber
            title="First-Time Attendee Second-Event Rate"
            date={`All attendees · ${semesterLabel}`}
            value={secondEvent?.percentage != null ? `${secondEvent.percentage.toFixed(1)}%` : "N/A"}
            detail={secondEvent ? `${secondEvent.successful.toLocaleString()} of ${secondEvent.eligible.toLocaleString()} first-time attendees` : "Engagement data unavailable"}
            summary="First-time attendees who attended another event."
            definition={`${SECOND_EVENT_DEFINITION}${cohortNote}${snapshotNote}`}
            methodologyHref="/methodology#second-event"
            trending={false}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("KPI Cards error:", error);
    throw new Error(`Failed to load KPI cards: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function OverviewChartSection({ semester }: { semester: string }) {
  try {
    const json = await authenticatedServerFetch<AnalyticsOverview>(
      buildAnalyticsEndpoint("/api/analytics/overview", semester),
    );
    const membersOverTime = json?.overview?.members_over_time ?? [];

    return (
      <div className="min-w-0">
        <ChartLineMultiple
          dateRangeLabel={`${semester === "all" ? "All time · " : "Selected semester · "}${dateRangeLabel(json?.meta?.start, json?.meta?.end)}`}
          data={membersOverTime.map((d: any) => ({
            month: d.period,
            registered: d.registered_members_cumulative,
          }))}
        />
      </div>
    );
  } catch (error) {
    console.error("Chart error:", error);
    throw new Error(`Failed to load chart: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function MissionSectionWrapper({ semester, periodLabel }: { semester: string; periodLabel: string }) {
  try {
    const missionJson = await authenticatedServerFetch<MissionResponse>(
      buildAnalyticsEndpoint("/api/analytics/mission", semester),
    );
    const mission = {
      major_category_distribution: missionJson?.mission?.major_category_distribution ?? missionJson?.major_category_distribution ?? [],
      class_year_distribution: missionJson?.mission?.class_year_distribution ?? missionJson?.class_year_distribution ?? [],
      event_major_category_percent: missionJson?.mission?.event_major_category_percent ?? missionJson?.event_major_category_percent ?? [],
    };

    return (
      <div className="min-w-0">
        <MissionSection data={mission} periodLabel={periodLabel} isFiltered={semester !== "all"} />
      </div>
    );
  } catch (error) {
    console.error("Mission section error:", error);
    throw new Error(`Failed to load mission data: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function RetentionChartSection({ semester }: { semester: string }) {
  try {
    const retentionJson = await authenticatedServerFetch<RetentionResponse>(
      buildAnalyticsEndpoint("/api/analytics/retention", semester),
    );
    const retention =
      retentionJson?.retention?.retention ??
      retentionJson?.retention ??
      retentionJson;

    return (
      <div className="min-w-0">
        <RetentionDistributionChart
          data={retention}
          periodLabel={`${semester === "all" ? "All time · " : "Selected semester · "}${dateRangeLabel(retentionJson?.meta?.start, retentionJson?.meta?.end)}`}
        />
      </div>
    );
  } catch (error) {
    console.error("Retention chart error:", error);
    throw new Error(`Failed to load retention data: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
