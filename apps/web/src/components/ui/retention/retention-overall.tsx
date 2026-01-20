"use client";

// import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  CardContent,
  //Card, CardDescription,CardFooter,CardHeader,CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A bar chart";

const chartConfig = {
  count: {
    label: "Attendees",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function RetentionOverall({ data }: { data: any }) {
  // Transform data from backend format
  const chartData = data?.attendance_count_distribution_overall
    ? data.attendance_count_distribution_overall.map((item: any) => ({
        bucket: item.events_attended_bucket + " events",
        count: item.people,
      }))
    : [
        { bucket: "0 events", count: 186 },
        { bucket: "1 event", count: 305 },
        { bucket: "2 events", count: 237 },
        { bucket: "3 events", count: 73 },
        { bucket: "4+ events", count: 209 },
      ];

  return (
    <CardContent>
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="bucket"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.split(" ")[0]} // Show just "0", "1", "2", etc.
          />
          <YAxis
            className="pr-2"
            axisLine={false}
            label={{
              value: "Number of Members",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="count" fill="var(--color-count)" radius={8} />
        </BarChart>
      </ChartContainer>
    </CardContent>
  );
}
