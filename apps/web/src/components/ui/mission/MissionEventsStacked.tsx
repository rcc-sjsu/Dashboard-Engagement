"use client";

import { useMemo } from "react";
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
   // One object per event with keys for each major category
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


           // Every event row must have every major key so stacking/legend is consistent
           for (const m of majorOrder) row[m] = 0;


           // Fill counts for majors in event segments
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
           </CardContent>
       </Card>
   );
}
