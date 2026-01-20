"use client"

import { Cell, Pie, PieChart } from "recharts"
import { CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  Freshman: { label: "Freshman", color: "var(--chart-1)" },
  Sophomore: { label: "Sophomore", color: "var(--chart-2)" },
  Junior: { label: "Junior", color: "var(--chart-3)" },
  Senior: { label: "Senior", color: "var(--chart-4)" },
  Grad: { label: "Grad", color: "var(--chart-5)" },
  "Other/Unknown": { label: "Other/Unknown", color: "var(--chart-6)" },
  "4th+ year": { label: "4th+ year", color: "var(--chart-7)" },
} satisfies ChartConfig

export function PieChartYear({
  data,
}: {
  data: { class_year: string; members: number }[]
}) {
  return (
    <CardContent className="flex-1 h-full">
      <ChartContainer
        config={chartConfig}
        className="h-full w-full" 
      >
        <PieChart className="w-full" margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />

          <Pie data={data} dataKey="members" nameKey="class_year" isAnimationActive={false} 
          label={({ value }) => {
            if (!value) return null
            return `${value}`
          }} labelLine>
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