"use client"

import { Cell, Pie, PieChart } from "recharts"
import { CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type YearSlice = {
  class_year: string;
  members: number;
};

const chartConfig = {
  Freshman: { label: "Freshman", color: "var(--chart-1)" },
  Sophomore: { label: "Sophomore", color: "var(--chart-2)" },
  Junior: { label: "Junior", color: "var(--chart-3)" },
  Senior: { label: "Senior", color: "var(--chart-4)" },
  Grad: { label: "Grad", color: "var(--chart-5)" },
  "Other/Unknown": { label: "Other/Unknown", color: "var(--chart-6)" },
  "4th+ year": { label: "4th+ year", color: "var(--chart-7)" },
} satisfies ChartConfig

/**
 * Class year distribution pie chart
 * Slice colors are keyed by `class_year` for consistency across charts
 */
export function PieChartYear({ data }: { data: YearSlice[] }) {
  return (
    <CardContent className="flex-1 pb-0">
      <ChartContainer
        config={chartConfig}
        className="mx-auto h-[260px] w-full" 
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />

          <Pie data={data} dataKey="members" nameKey="class_year" isAnimationActive={false}>
            {data.map((entry, i) => {
              const key = entry.class_year as keyof typeof chartConfig
              const fill = chartConfig[key]?.color ?? "var(--chart-1)"
              return <Cell key={`cell-${i}`} fill={fill} />
            })}
          </Pie>
        </PieChart>
      </ChartContainer>
    </CardContent>
  )
}