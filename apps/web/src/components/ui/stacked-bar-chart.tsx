"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface ChartBarStackedProps {
  data?: Array<{
    category: string
    value: number
  }>
  title?: string
  description?: string
}

const BAR_COLORS = [
  "#3B82F6", // blue
  "#22C55E", // green
  "#EF4444", // red
  "#F97316", // orange
  "#A855F7", // purple
  "#EAB308", // yellow
]

export function ChartBarStacked({
  data,
  title = "Members by Class Year",
  description = "Aug 2025 – Jan 2026",
}: ChartBarStackedProps) {
  // Expected incoming shape: [{ category: "Freshman", value: 72 }, ...]
  const chartData = (data ?? []).map((d, i) => ({
    ...d,
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }))

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  // ChartContainer expects a config; we only have one series ("value")
  const chartConfig = {
    value: { label: "Members", color: "var(--chart-1)" },
  } satisfies ChartConfig

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 flex-1">
        {/* Chart fills available height */}
        <ChartContainer config={chartConfig} className="w-full h-full min-h-[320px]">
          <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(0, 3)}
            />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />

            {/* Single-series bars, each bar uses its own fill color */}
            <Bar dataKey="value" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>

        {/* LEGEND (replaces footer + weird cube) */}
        <div className="w-full space-y-2 text-sm">
          {chartData.map((item) => {
            const pct = total ? ((item.value / total) * 100).toFixed(1) : "0.0"
            return (
              <div
                key={item.category}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="font-medium truncate">{item.category}</span>
                </div>

                <div className="text-muted-foreground shrink-0">
                  {item.value} ({pct}%)
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
