"use client";

import { useMemo, useState } from "react";
import ToggleBar from "@/components/ui/toggle-bar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChartMajor } from "@/components/ui/mission/pie-chart-major";
import { PieChartYear } from "@/components/ui/mission/pie-chart-year";
import { MissionEventsStacked } from "@/components/ui/mission/MissionEventsStacked";

const MAJOR_ORDER = ["Technical", "Business", "Humanities & Arts", "Health Sciences", "Other/Unknown"] as const;
const YEAR_ORDER = ["Freshman", "Sophomore", "Junior", "Senior", "Grad", "Other/Unknown", "4th+ year"] as const;

const majorLegendConfig: Record<string, { label: string; color: string }> = {
    Technical: { label: "Technical", color: "var(--chart-1)" },
    Business: { label: "Business", color: "var(--chart-2)" },
    "Humanities & Arts": { label: "Humanities & Arts", color: "var(--chart-3)" },
    "Health Sciences": { label: "Health Sciences", color: "var(--chart-4)" },
    "Other/Unknown": { label: "Other/Unknown", color: "var(--chart-5)" },
};

type LegendItem = { label: string; color: string };

const yearLegendConfig: Record<string, LegendItem> = {
    Freshman: { label: "Freshman", color: "var(--chart-1)" },
    Sophomore: { label: "Sophomore", color: "var(--chart-2)" },
    Junior: { label: "Junior", color: "var(--chart-3)" },
    Senior: { label: "Senior", color: "var(--chart-4)" },
    Grad: { label: "Grad", color: "var(--chart-5)" },
    "Other/Unknown": { label: "Other/Unknown", color: "var(--chart-6)" },
    "4th+ year": { label: "4th+ year", color: "var(--chart-7)" },
}

function Legend({ items }: { items: Record<string, { label: string; color: string }> }) {
    const values = Object.values(items);
    return (
        <div className="flex flex-wrap justify-center gap-2 text-[11px] sm:text-xs">
        {values.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    );
}

type MajorDistRow = {
    major_category: string;
    members: number;
};

type YearDistRow = {
    class_year: string;
    members: number; 
};

type MissionData = {
    major_category_distribution: MajorDistRow[];
    class_year_distribution: YearDistRow[];
    event_major_category_percent: any[];
};

/**
 * MissionSection fetches /api/analytics/mission once and uses data for:
 * - Pie chart (Major vs Year toggle)
 * - Stacked event diversity chart
 */
export function MissionSection({ data }: { data: MissionData }) {
    // Major vs Year toggle
    const [showMajor, setShowMajor] = useState(true);

    // Fill missing categories with 0 so charts/legends stay stable even if a category is absent
    const majorDist = useMemo(() => {
        const dist = data?.major_category_distribution ?? [];
        // order + fill missing to 0
        const map = new Map(dist.map((d) => [d.major_category, d.members]));
        return MAJOR_ORDER.map((k) => ({ major_category: k, members: map.get(k) ?? 0 }));
    }, [data]);
    
    const yearDist = useMemo(() => {
        const dist = data?.class_year_distribution ?? [];
        const map = new Map(dist.map((d) => [d.class_year, d.members]));
        return YEAR_ORDER.map((k) => ({ class_year: k, members: map.get(k) ?? 0 }));
    }, [data]);

    const events = data?.event_major_category_percent ?? [];

    return (
        <section className="w-full flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold">Who We’re Growing (Mission)</h3>
                <p className="text-sm text-muted-foreground">
                    Major distribution, class year distribution, and event-by-event diversity.
                </p>
            </div>

            <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            {/* LEFT: Pie card (Major vs Year) */}
                <div className="min-w-0">
                    <Card className="flex h-full flex-col">
                        <CardHeader className="items-center pb-2 text-center">
                            <CardTitle>{showMajor ? "Members by Major Category" : "Members by Class Year"}</CardTitle>
                        </CardHeader>

                        <div className="flex justify-center ">
                            <div className="rounded-full border border-muted-foreground/20 bg-muted/60">
                                <ToggleBar
                                    options={[
                                        { label: "Major", value: "major" },
                                        { label: "Year", value: "year" },
                                    ]}
                                    onChange={(v) => setShowMajor(v === "major")}
                                />
                            </div>
                        </div>

                        {showMajor ? (
                            <PieChartMajor data={majorDist} />
                        ) : (
                            <PieChartYear data={yearDist} />
                        )}

                        <CardFooter className="flex flex-col gap-3 pt-2 text-sm">
                            {showMajor ? <Legend items={majorLegendConfig} /> : <Legend items={yearLegendConfig} />}
                        </CardFooter>
                    </Card>
                </div>

                {/* RIGHT: Events stacked bar */}
                <div className="min-w-0">
                    <MissionEventsStacked
                        events={events}
                        majorOrder={[...MAJOR_ORDER]}
                    />
                </div>
            </div>
    </section>
  );
}
