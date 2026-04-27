import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ChartLineMultiple } from "@/components/ui/line-graph";
import { BigNumber } from "@/components/ui/kpi";
import { RetentionDistributionChart } from "@/components/ui/retention/retention-distribution";
import { MissionSection } from "@/components/ui/mission/MissionSection";
import { authenticatedServerFetch } from "@/lib/api-client";
import { SemesterFilter } from "@/components/dashboard/semester-filter";
import {
  KPICardsSkeleton,
  ChartSkeleton,
  MissionSectionSkeleton,
  RetentionChartSkeleton,
} from "@/components/dashboard/skeletons";

// Type definitions for API responses
interface AnalyticsOverview {
  overview?: {
    kpis?: Record<string, any>;
    members_over_time?: Array<{
      period: string;
      registered_members_cumulative: number;
      active_members_cumulative: number;
    }>;
  };
  meta?: {
    start?: string;
    end?: string;
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
          <h3 className="text-sm font-medium text-muted-foreground sm:text-base">
            Overview & Growth
          </h3>
        </div>

        {/* KPI CARDS */}
        <Suspense fallback={<KPICardsSkeleton />} key={`kpi-${selectedSemester}`}>
          <KPICardsSection semester={selectedSemester} />
        </Suspense>

        {/* LINE CHART */}
        <Suspense fallback={<ChartSkeleton />} key={`chart-${selectedSemester}`}>
          <OverviewChartSection semester={selectedSemester} />
        </Suspense>

        {/* MISSION SECTION */}
        <Suspense fallback={<MissionSectionSkeleton />} key={`mission-${selectedSemester}`}>
          <MissionSectionWrapper semester={selectedSemester} />
        </Suspense>

        {/* RETENTION SECTION */}
        <Suspense fallback={<RetentionChartSkeleton />} key={`retention-${selectedSemester}`}>
          <RetentionChartSection semester={selectedSemester} />
        </Suspense>
      </div>
    </main>
  );
}

async function KPICardsSection({ semester }: { semester: string }) {
  try {
    const json = await authenticatedServerFetch<AnalyticsOverview>(
      buildAnalyticsEndpoint("/api/analytics/overview", semester),
    );
    const kpis = json?.overview?.kpis ?? {};

    const activePctRaw = kpis.active_member_pct ?? kpis.active_members_pct ?? 0;
    const activePct = activePctRaw; // already percent

    const growthRaw = kpis.registered_growth_last_30d_pct ?? 0;
    const growthPct = growthRaw; // already percent

    return (
      <div className="flex flex-col gap-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <BigNumber
            title="Total Members"
            date="All time"
            value={kpis.total_members ?? 0}
            trending={false}
          />

          <BigNumber
            title="Active Members"
            date="All time"
            value={kpis.active_members ?? 0}
            trending={false}
          />

          <BigNumber
            title="Active %"
            date="All time"
            value={`${activePct.toFixed(1)}%`}
            trending={true}
            trendText={`Growth (30d): ${growthPct.toFixed(1)}%`}
            trendUp={growthPct >= 0}
          />

          <BigNumber
            title="Registered Growth"
            date="Last 30 days"
            value={`${growthPct.toFixed(1)}%`}
            trending={true}
            trendText="vs previous 30 days"
            trendUp={growthPct >= 0}
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
          dateRangeLabel={`${json?.meta?.start ?? "Aug 2025"} - ${
            json?.meta?.end ?? "Jan 2026"
          }`}
          data={membersOverTime.map((d: any) => ({
            month: d.period,
            registered: d.registered_members_cumulative,
            active: d.active_members_cumulative,
          }))}
        />
      </div>
    );
  } catch (error) {
    console.error("Chart error:", error);
    throw new Error(`Failed to load chart: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function MissionSectionWrapper({ semester }: { semester: string }) {
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
        <MissionSection data={mission} />
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
        <RetentionDistributionChart data={retention} />
      </div>
    );
  } catch (error) {
    console.error("Retention chart error:", error);
    throw new Error(`Failed to load retention data: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
