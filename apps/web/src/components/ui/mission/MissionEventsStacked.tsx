"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

type EventSegment = { major_category: string; pct: number; count: number };
type EventMajorCategoryPercent = {
    event_id: string;
    event_title: string;
    starts_at: string;
    total_attendees: number;
    segments: EventSegment[];
};

type Props = {
    loading: boolean;
    error: string | null;
    events: EventMajorCategoryPercent[];
    majorOrder: string[]
};

export function MissionEventsStacked( { loading, error, events, majorOrder }: Props ) {
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
                label: evt.event_title.length > 18 ? evt.event_title.slice(0, 18) + "…" : evt.event_title,
            };

            // all major keys initialized to 0
            for (const m of majorOrder) row[m] = 0;

            // fill in pct from segments
            for (const seg of evt.segments) {
                row[seg.major_category] = seg.count ?? 0;
            }

            return row;
        });
    }, [events, majorOrder]);

    const chartConfig = {
        Technical: { label: "Technical", color: "var(--chart-1)" },
        Business: { label: "Business", color: "var(--chart-2)" },
        "Humanities & Arts": { label: "Humanities & Arts", color: "var(--chart-3)" },
        "Health Sciences": { label: "Health Sciences", color: "var(--chart-4)" },
        "Other/Unknown": { label: "Other/Unknown", color: "var(--chart-5)" },
      } satisfies ChartConfig;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Event Diversity by Major</CardTitle>
            </CardHeader>
    
            <CardContent>
                {loading && <div className="text-sm text-muted-foreground">Loading mission…</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
    
                {!loading && !error && (
                    <ChartContainer config={chartConfig}>
                        <BarChart accessibilityLayer data={data} >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                angle={-35}
                                textAnchor="end"
                                height={90}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
            
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
                )}
            </CardContent>
        </Card>
    );
} 