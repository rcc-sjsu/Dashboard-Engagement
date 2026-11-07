"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { MetricDefinition } from "@/components/dashboard/metric-definition";

export const description = "A multiple line chart";

const chartConfig = {
  registered: {
    label: "Registered",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type LineChartDatum = {
  month: string; // e.g. "2025-09" or "Sep"
  registered: number;
};

export function ChartLineMultiple({
  data,
  dateRangeLabel,
}: {
  data: LineChartDatum[];
  dateRangeLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Growth Over Time</CardTitle>
        <CardDescription>
          Registered members · {dateRangeLabel}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const s = String(value);
                // If value is YYYY-MM, show MM (or you can change to month name later)
                if (/^\d{4}-\d{2}$/.test(s)) return s.slice(5);
                return s.length > 3 ? s.slice(0, 3) : s;
              }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              label={{
                value: "Member Count",
                angle: -90,
                position: "insideLeft",
                offset: -5,
              }}
            />

            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Legend />

            <Line
              dataKey="registered"
              type="monotone"
              name={chartConfig.registered.label}
              stroke={chartConfig.registered.color}
              strokeWidth={2}
              dot={false}
            />

          </LineChart>
        </ChartContainer>
      </CardContent>

      <CardFooter>
        <MetricDefinition
          title="Member Growth Over Time"
          definition="Cumulative registrations within the selected period, grouped by month.\nWith a semester selected, only registrations during that semester are included. Unknown registration dates are excluded from the timeline.\nActive membership is measured separately for each semester in the Active Members card or table."
          methodologyHref="/methodology#member-growth"
        />
      </CardFooter>
    </Card>
  );
}
