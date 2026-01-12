"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A multiple line chart"

// SAME COLORS AS PIE / BAR
const LINE_COLORS = {
  registered: "#3B82F6", // blue
  active: "#22C55E",     // green
}

const chartConfig = {
  registered: {
    label: "Registered",
    color: LINE_COLORS.registered,
  },
  active: {
    label: "Active",
    color: LINE_COLORS.active,
  },
} satisfies ChartConfig

interface ChartLineMultipleProps {
  data?: Array<{
    month: string
    registered: number
    active: number
  }>
  title?: string
  description?: string
  trend?: string
  showTrend?: boolean
}

export function ChartLineMultiple({
  data,
  title = "Line Chart - Multiple",
  description = "January - June 2024",
  trend,
  showTrend = false,
}: ChartLineMultipleProps) {
  const chartData = data || [
    { month: "January", registered: 186, active: 80 },
    { month: "February", registered: 305, active: 200 },
    { month: "March", registered: 237, active: 120 },
    { month: "April", registered: 73, active: 190 },
    { month: "May", registered: 209, active: 130 },
    { month: "June", registered: 214, active: 140 },
  ]

  const formatPeriod = (period: string) => {
    if (!period) return ""

    if (period.includes("-")) {
      const [, month] = period.split("-")
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ]
      return monthNames[parseInt(month) - 1] || period
    }

    return period.slice(0, 3)
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ChartContainer config={chartConfig} className="h-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatPeriod}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Legend />

            <Line
              dataKey="registered"
              type="monotone"
              name={chartConfig.registered.label}
              stroke={LINE_COLORS.registered}
              strokeWidth={2.5}
              dot={false}
            />

            <Line
              dataKey="active"
              type="monotone"
              name={chartConfig.active.label}
              stroke={LINE_COLORS.active}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>

      {showTrend && trend ? (
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="flex items-center gap-2 leading-none font-medium">
              {trend} <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </CardFooter>
      ) : (
        <CardFooter className="h-4" />
      )}
    </Card>
  )
}
