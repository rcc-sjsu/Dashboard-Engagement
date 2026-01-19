"use client";

import { Cell, LabelList, Pie, PieChart } from "recharts";
import { CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  Technical: { label: "Technical", color: "var(--chart-1)" },
  Business: { label: "Business", color: "var(--chart-2)" },
  "Humanities & Arts": { label: "Humanities & Arts", color: "var(--chart-3)" },
  "Health Sciences": { label: "Health Sciences", color: "var(--chart-4)" },
  "Other/Unknown": { label: "Other/Unknown", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function PieChartMajor({
  data,
}: {
  data: { major_category: string; members: number }[];
}) {
  return (
    <CardContent className="flex-1 pb-0"> 
      <ChartContainer
        config={chartConfig}
        className="mx-auto h-[260px] w-full" 
      >
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />

          <Pie data={data} dataKey="members" nameKey="major_category" isAnimationActive={false} >
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