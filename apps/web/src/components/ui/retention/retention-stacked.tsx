"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  // Card,  CardHeader, CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A stacked bar chart with a legend";

const chartConfig = {
  Technical: {
    label: "Technical",
    color: "var(--chart-1)",
  },
  Business: {
    label: "Business",
    color: "var(--chart-2)",
  },
  "Humanities & Arts": {
    label: "Humanities & Arts",
    color: "var(--chart-3)",
  },
  "Health Sciences": {
    label: "Health Sciences",
    color: "var(--chart-4)",
  },
  "Other/Unknown": {
    label: "Other/Unknown",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function RetentionStacked({ data }: { data: any }) {
  // Transform backend data to stacked format
  const chartData = transformToStackedData(
    data?.attendance_count_distribution_by_major_category ?? [],
  );

  // Major categories to render as stacked bars
  const keys = Object.keys(chartConfig);

  return (
    <CardContent>
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={1}
            axisLine={false}
            label={{
              value: "Events Attended",
              position: "insideBottom",
              offset: -5,
            }}
          />
          <YAxis
            className="pr-2"
            axisLine={false}
            label={{
              value: "Number of People",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <ChartLegend content={<ChartLegendContent />} />

          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={chartConfig[key as keyof typeof chartConfig].color}
              name={key}
              radius={index === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </CardContent>
  );
}

// Helper function to transform backend data to stacked format
function transformToStackedData(byMajor: any[]) {
  // Get all unique buckets
  const buckets = ["0", "1", "2", "3", "4+"];

  const bucketMap: any = {};

  buckets.forEach((bucket) => {
    bucketMap[bucket] = {
      month: bucket,
      Technical: 0,
      Business: 0,
      "Humanities & Arts": 0,
      "Health Sciences": 0,
      "Other/Unknown": 0,
    };
  });

  // Fill  data from backend
  byMajor.forEach((majorData) => {
    const rawCategory = majorData.major_category;
    const majorCategory = rawCategory === "Unknown" || rawCategory === "Unknown/other"
      ? "Other/Unknown"
      : rawCategory;
    majorData.distribution.forEach((item: any) => {
      const bucket = item.events_attended_bucket;
      if (bucketMap[bucket]) {
        bucketMap[bucket][majorCategory] = (bucketMap[bucket][majorCategory] ?? 0) + item.people;
      }
    });
  });

  return buckets.map((bucket) => bucketMap[bucket]);
}
