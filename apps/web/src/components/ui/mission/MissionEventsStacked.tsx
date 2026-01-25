"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    ChartContainer, 
    ChartLegend, 
    ChartLegendContent, 
    ChartTooltip, 
    ChartTooltipContent, 
    type ChartConfig 
} from "@/components/ui/chart";

// Backend segment for an event (from mission endpoint) 
type EventSegment = { 
    major_category: string; 
    pct: number; 
    count: number };

// Backend event object for stacked chart (from mission endpoint)
type EventMajorCategoryPercent = {
    event_id: string;
    event_title: string;
    starts_at: string;
    total_attendees: number;
    segments: EventSegment[];
};

type Props = {
    events: EventMajorCategoryPercent[];
    majorOrder: string[]
};

/**
 * Stacked bar chart: each bar = event, each segment = major category
 * Uses `count` (not %) so the stacked height equals total categorized attendees
 */
export function MissionEventsStacked( { events, majorOrder }: Props ) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const update = () => setIsMobile(window.innerWidth < 768);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const labelMax = isMobile ? 16 : 20;

    // one object per event with keys for each major category
    const data = useMemo(() => {
        return events
        .slice()
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        .map((evt) => {
            const row: Record<string, any> = {
                event_id: evt.event_id,
                event_title: evt.event_title,
                starts_at: evt.starts_at,
                total_attendees: evt.total_attendees,
                label:
                    evt.event_title.length > labelMax
                        ? `${evt.event_title.slice(0, labelMax)}…`
                        : evt.event_title,
            };

            // Every event row must have every major key so stacking/legend is consistent
            for (const m of majorOrder) row[m] = 0;

            // Fill counts for majors in event segments
            for (const seg of evt.segments) {
                row[seg.major_category] = seg.count ?? 0;
            }

            return row;
        });
    }, [events, majorOrder, labelMax]);

    const minChartWidth = Math.max(320, data.length * 72);

    const chartConfig = {
        Technical: { label: "Technical", color: "var(--chart-1)" },
        Business: { label: "Business", color: "var(--chart-2)" },
        "Humanities & Arts": { label: "Humanities & Arts", color: "var(--chart-3)" },
        "Health Sciences": { label: "Health Sciences", color: "var(--chart-4)" },
        "Other/Unknown": { label: "Other/Unknown", color: "var(--chart-5)" },
      } satisfies ChartConfig;

    const majorLabelMap = {
        Technical: "Technical",
        Business: "Business",
        "Humanities & Arts": "Humanities & Arts",
        "Health Sciences": "Health Sciences",
        "Other/Unknown": "Other/Unknown",
    } as const;

    const mobileRows = useMemo(() => {
        return data.map((row) => {
            const totals = majorOrder.map((key) => ({
                key,
                count: row[key] ?? 0,
            }));
            const totalCount = totals.reduce((sum, item) => sum + item.count, 0);
            return {
                id: row.event_id,
                title: row.event_title,
                total: totalCount,
                segments: totals.map((item) => ({
                    key: item.key,
                    count: item.count,
                    pct: totalCount ? (item.count / totalCount) * 100 : 0,
                    color:
                        chartConfig[item.key as keyof typeof chartConfig]?.color ??
                        "var(--chart-1)",
                })),
            };
        });
    }, [data, majorOrder, chartConfig]);

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">Event Diversity by Major</CardTitle>
            </CardHeader>
    
            <CardContent className="pt-0">
                {isMobile ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-2 text-[11px]">
                            {majorOrder.map((key) => {
                                const cfg = chartConfig[key as keyof typeof chartConfig];
                                return (
                                    <div key={key} className="flex items-center gap-1.5">
                                        <span
                                            className="h-2 w-2 rounded-[2px]"
                                            style={{ backgroundColor: cfg?.color }}
                                        />
                                        <span className="text-muted-foreground">
                                            {majorLabelMap[key as keyof typeof majorLabelMap] ?? key}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col gap-3">
                            {mobileRows.map((row) => (
                                <div
                                    key={row.id}
                                    className="rounded-lg border border-border/60 bg-background/40 p-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="text-sm font-medium leading-snug">
                                            {row.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {row.total} attendees
                                        </div>
                                    </div>
                                    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-muted">
                                        <div className="flex h-full w-full">
                                            {row.segments.map((segment) => (
                                                <div
                                                    key={segment.key}
                                                    style={{
                                                        width: `${segment.pct}%`,
                                                        backgroundColor: segment.color,
                                                    }}
                                                    className="h-full"
                                                    title={`${segment.key}: ${segment.count}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <ChartContainer
                            config={chartConfig}
                            className="aspect-auto h-[280px] w-full sm:h-[320px] lg:h-[420px]"
                            style={{ minWidth: minChartWidth }}
                        >
                            <BarChart
                                accessibilityLayer
                                data={data}
                                barCategoryGap={16}
                                margin={{
                                    top: 8,
                                    right: 8,
                                    left: 8,
                                    bottom: 48,
                                }}
                            >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    interval={0}
                                    angle={-35}
                                    textAnchor="end"
                                    height={90}
                                    tickMargin={8}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis tickLine={false} axisLine={false} />
                                <ChartTooltip content={<ChartTooltipContent labelKey="event_title" />} />
                                <ChartLegend
                                    content={<ChartLegendContent className="flex-wrap gap-2 text-xs" />}
                                />
                
                                {majorOrder.map((key, index) => {
                                    const cfg = chartConfig[key as keyof typeof chartConfig];
                                    return (
                                        <Bar
                                            key={key}
                                            dataKey={key}
                                            stackId="a"
                                            fill={cfg ? cfg.color : "var(--chart-1)"}
                                            radius={index === majorOrder.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                        />
                                    );
                                })}
                            </BarChart>
                        </ChartContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 
