import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";

import { ChartLineMultiple } from "@/components/ui/line-graph";
import { ChartPieLabelList } from "@/components/ui/pie-chart";
import { ChartBarStacked } from "@/components/ui/stacked-bar-chart";
import { BigNumber } from "@/components/ui/kpi";
import { RetentionDistributionChart } from "@/components/ui/retention-distribution";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/signin");
  }

  // Fetch overview analytics
  const base = process.env.NEXT_PUBLIC_SERVER_URL;
  const res = await fetch(`${base}/analytics/overview`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Overview fetch failed: ${res.status}`);
  }

  const json = await res.json();

  const kpis = json?.overview?.kpis ?? {};
  const membersOverTime = json?.overview?.members_over_time ?? [];

  const activePctRaw = kpis.active_member_pct ?? kpis.active_members_pct ?? 0;
  const activePct = activePctRaw <= 1 ? activePctRaw * 100 : activePctRaw;

  const growthRaw = kpis.registered_growth_last_30d_pct ?? 0;
  const growthPct = growthRaw <= 1 ? growthRaw * 100 : growthRaw;

  return (
    <main className="flex w-full flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-10 xl:px-12">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold sm:text-3xl">
              RCC Engagement Dashboard
            </h1>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground sm:text-base">
            Overview & Growth
          </h3>
        </div>

        <div className="flex flex-col gap-8">
          {/* KPI CARDS */}
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

          {/* LINE CHART */}
          <div className="min-w-0">
            <ChartLineMultiple
              dateRangeLabel={`${json?.meta?.start ?? ""} - ${json?.meta?.end ?? ""}`}
              data={membersOverTime.map((d: any) => ({
                month: d.period,
                registered: d.registered_members_cumulative,
                active: d.active_members_cumulative,
              }))}
            />
          </div>

          {/* OTHER CHARTS */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-1">
              <ChartPieLabelList />
            </div>
            <div className="min-w-0 lg:col-span-2">
              <ChartBarStacked />
            </div>
          </div>

          {/* RETENTION */}
          <div className="min-w-0">
            <RetentionDistributionChart />
          </div>
        </div>
      </div>
    </main>
  );
}
