"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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

export const description = "A bar chart"

const chartConfig = {
  desktop: {
    label: "Attendees",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function RetentionOverall({ data }: { data: any }) {
  // Transform data from backend format
  const chartData = data?.attendance_count_distribution_overall 
    ? data.attendance_count_distribution_overall.map((item: any) => ({
        month: item.events_attended_bucket + " events",
        desktop: item.people
      }))
    : [
        { month: "January", desktop: 186 },
        { month: "February", desktop: 305 },
        { month: "March", desktop: 237 },
        { month: "April", desktop: 73 },
        { month: "May", desktop: 209 },
        { month: "June", desktop: 214 },
      ];

  return (
    <CardContent>
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
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
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
        </BarChart>
      </ChartContainer>
    </CardContent>
  )
}