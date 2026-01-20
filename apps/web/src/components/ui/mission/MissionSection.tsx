"use client";

import { useEffect, useMemo, useState } from "react";
import ToggleBar from "@/components/ui/toggle-bar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChartMajor } from "@/components/ui/mission/pie-chart-major";
import { PieChartYear } from "@/components/ui/mission/pie-chart-year";
import { MissionEventsStacked } from "@/components/ui/mission/MissionEventsStacked";

// Matching mission.py output shape
type MajorDistItem = { major_category: string; members: number };
type YearDistItem = { class_year: string; members: number };

type EventSegment = { major_category: string; pct: number; count: number };
type EventMajorCategoryPercent = {
    event_id: string;
    event_title: string;
    starts_at: string;
    total_attendees: number;
    segments: EventSegment[];
};

type MissionPayload = {
    mission: {
        major_category_distribution: MajorDistItem[];
        class_year_distribution: YearDistItem[];
        event_major_category_percent: EventMajorCategoryPercent[];
    };
};

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
        <div className="flex flex-wrap justify-center gap-2">
        {values.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-xs">{item.label}</span>
          </div>
        ))}
      </div>
    );
}

/**
 * MissionSection fetches /analytics/mission once and uses data for:
 * - Pie chart (Major vs Year toggle)
 * - Stacked event diversity chart
 */
export function MissionSection() {
    // Major vs Year toggle
    const [showMajor, setShowMajor] = useState(true);

    // Data loading
    const [payload, setPayload] = useState<MissionPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch mission payload once on mount
    useEffect(() => {
        async function loadMission() {
            try {
                setLoading(true);
                setError(null);

                const base = process.env.NEXT_PUBLIC_SERVER_URL;
                if (!base) throw new Error("NEXT_PUBLIC_SERVER_URL is not set");

                const res = await fetch(`${base}/analytics/mission`, { cache: "no-store" });
                const text = await res.text();

                if (!res.ok) {
                throw new Error(text || `Mission fetch failed: ${res.status}`);
                }

                const json = JSON.parse(text);
                setPayload(json);
            } catch (e: any) {
                setError(e?.message ?? "Failed to load mission data.");
            } finally {
                setLoading(false);
            }
        }

        loadMission();
    }, []);

    // Fill missing categories with 0 so charts/legends stay stable even if a category is absent
    const majorDist = useMemo(() => {
        const dist = payload?.mission.major_category_distribution ?? [];
        // order + fill missing to 0
        const map = new Map(dist.map((d) => [d.major_category, d.members]));
        return MAJOR_ORDER.map((k) => ({ major_category: k, members: map.get(k) ?? 0 }));
    }, [payload]);
    
    const yearDist = useMemo(() => {
        const dist = payload?.mission.class_year_distribution ?? [];
        const map = new Map(dist.map((d) => [d.class_year, d.members]));
        return YEAR_ORDER.map((k) => ({ class_year: k, members: map.get(k) ?? 0 }));
    }, [payload]);

    const events = payload?.mission.event_major_category_percent ?? [];

    return (
        <section className="w-full flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold">Who We’re Growing (Mission)</h3>
                <p className="text-sm text-muted-foreground">
                    Major distribution, class year distribution, and event-by-event diversity.
                </p>
            </div>

            <div className="flex gap-8 w-full">
            {/* LEFT: Pie card (Major vs Year) */}
                <div className="flex-1">
                    <Card className="flex flex-col h-full">
                        <CardHeader className="items-center pb-2">
                            <CardTitle>{showMajor ? "Members by Major Category" : "Members by Class Year"}</CardTitle>
                        </CardHeader>

                <div className="flex justify-center ">
                    <ToggleBar
                        options={[
                            { label: "Major", value: "major" },
                            { label: "Year", value: "year" },
                        ]}
                        onChange={(v) => setShowMajor(v === "major")}
                    />
                </div>

                <CardContent className="flex-1 min-h-0">
                    {loading && <div className="text-sm text-muted-foreground">Loading mission…</div>}
                    {error && <div className="text-sm text-red-600">{error}</div>}
                    
                    {!loading && !error && (
                        showMajor ? (
                            <PieChartMajor data={majorDist} />
                        ) : (
                            <PieChartYear data={yearDist} />
                        )
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3 text-sm">
                    {showMajor ? <Legend items={majorLegendConfig} /> : <Legend items={yearLegendConfig} />}
                </CardFooter>
            </Card>
        </div>

        {/* RIGHT: Events stacked bar */}
        <div className="flex-2">
          <MissionEventsStacked
            loading={loading}
            error={error}
            events={events}
            majorOrder={[...MAJOR_ORDER]}
          />
        </div>
      </div>
    </section>
  );
}