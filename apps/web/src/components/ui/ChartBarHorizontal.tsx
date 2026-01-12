"use client"

import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"

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

export const description = "A horizontal bar chart with legend + fixed colors"

interface ChartBarHorizontalProps {
  data?: Array<{
    bucket: string
    people: number
  }>
  title?: string
  description?: string
}

// blue, green, red, orange, purple (matches your request)
const BAR_COLORS = [
  "#3B82F6", // blue
  "#22C55E", // green
  "#EF4444", // red
  "#F97316", // orange
  "#A855F7", // purple
]

const chartConfig = {
  people: {
    label: "People",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartBarHorizontal({
  data,
  title = "Event Attendance Distribution",
  description = "Overall attendance patterns",
}: ChartBarHorizontalProps) {
  // Expecting data like: [{ bucket: "0", people: 148 }, ...]
  const chartData = (data ?? []).map((item, index) => ({
    bucket: item.bucket,
    people: item.people,
    fill: BAR_COLORS[index % BAR_COLORS.length],
  }))

  const total = chartData.reduce((sum, d) => sum + d.people, 0)

  // For Y-axis labels: "0" -> "0", "4+" -> "4+"
  const formatBucket = (value: string) => String(value)

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 flex-1">
        {/* Chart */}
        <ChartContainer config={chartConfig} className="w-full min-h-[260px]">
          <BarChart
  accessibilityLayer
  data={chartData}
  layout="vertical"
  margin={{ left: -10, right: 16 }}
>

            <XAxis type="number" dataKey="people" hide />
            <YAxis
              dataKey="bucket"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={formatBucket}
            />
            <ChartTooltip
  cursor={false}
  content={
    <ChartTooltipContent
      labelKey="bucket"
      nameKey="people"
    />
  }
/>


            <Bar dataKey="people" radius={6}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Legend (replaces footer) */}
        <div className="w-full space-y-2 text-sm">
          {chartData.map((item) => {
            const pct = total ? ((item.people / total) * 100).toFixed(1) : "0.0"
            return (
              <div
                key={item.bucket}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="font-medium truncate">
                    {item.bucket} attendee(s)
                  </span>
                </div>

                <div className="text-muted-foreground shrink-0">
                  {item.people} ({pct}%)
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
