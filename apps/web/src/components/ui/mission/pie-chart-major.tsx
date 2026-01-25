"use client";

import { Cell, Pie, PieChart } from "recharts";
import { CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type MajorSlice = {
  major_category: string;
  members: number;
};

const chartConfig = {
  Technical: { label: "Technical", color: "var(--chart-1)" },
  Business: { label: "Business", color: "var(--chart-2)" },
  "Humanities & Arts": { label: "Humanities & Arts", color: "var(--chart-3)" },
  "Health Sciences": { label: "Health Sciences", color: "var(--chart-4)" },
  "Other/Unknown": { label: "Other/Unknown", color: "var(--chart-5)" },
} satisfies ChartConfig;

/**
 * Major distribution pie chart
 * Colors are driven by `major_category` so they stay consistent across the dashboard
 */
export function PieChartMajor({ data }: { data: MajorSlice[] }) {
  return (
    <CardContent className="flex-1 min-h-[260px] sm:min-h-[320px] lg:min-h-[360px]"> 
      <ChartContainer
        config={chartConfig}
        className="h-full w-full"
      >
        <PieChart className="w-full" margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />

          <Pie data={data} dataKey="members" nameKey="major_category" isAnimationActive={false} 
          label={({ value }) => {
            if (!value) return null
            return `${value}`
          }} labelLine>
            {data.map((entry, i) => {
              const key = entry.major_category as keyof typeof chartConfig;
              const fill = chartConfig[key]?.color ?? "var(--chart-1)";
              return <Cell key={`cell-${i}`} fill={fill} />;
            })}
          </Pie>
        </PieChart>
      </ChartContainer>
    </CardContent>
  );
}
