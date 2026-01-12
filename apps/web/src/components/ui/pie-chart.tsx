"use client"

import { ResponsiveContainer, Pie, PieChart } from "recharts"

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
import { ToggleBar } from "@/components/ui/toggle"

export const description = "A pie chart with abbreviations, legend, and fixed colors"

interface ChartPieLabelListProps {
  data?: Array<{
    name: string
    value: number
  }>
  title?: string
  description?: string
}

// Fixed palette: blue, green, red, orange
const PIE_COLORS = [
  "#3B82F6", // blue
  "#22C55E", // green
  "#EF4444", // red
  "#F97316", // orange
]

// Domain-specific abbreviations
function abbrev(label: string) {
  const s = label.toLowerCase()

  if (s.includes("technical")) return "TECH"
  if (s.includes("business")) return "BUS"
  if (s.includes("humanities") || s.includes("arts")) return "H&A"
  if (s.includes("other") || s.includes("unknown")) return "O/U"

  // fallback initials
  return label
    .replace(/&/g, " ")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase()
}

export function ChartPieLabelList({
  data,
  title = "Members by Major Category",
  description = "Aug 2025 – Jan 2026",
}: ChartPieLabelListProps) {
  const transformedData = data
    ? data.map((item, index) => ({
        name: item.name,
        category: item.name,
        visitors: item.value,
        fill: PIE_COLORS[index % PIE_COLORS.length],
      }))
    : []

  const total = transformedData.reduce((sum, d) => sum + d.visitors, 0)

  const chartConfig = transformedData.reduce(
    (acc, item, index) => {
      acc[item.category] = {
        label: item.category,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }
      return acc
    },
    { visitors: { label: "Visitors" } } as ChartConfig
  )

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <ToggleBar />

      <CardContent className="flex flex-col items-center gap-6 pt-4">
        {/* CHART: fixed height prevents resize->0px issues */}
        <ChartContainer
          config={chartConfig}
          className="w-full max-w-[360px] h-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="visitors" />} />

              <Pie
                data={transformedData}
                dataKey="visitors"
                nameKey="name"
                outerRadius="85%"
                labelLine={false}
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  percent,
                  name,
                }) => {
                  // hide labels on tiny slices
                  if (percent < 0.06) return null

                  const RADIAN = Math.PI / 180
                  const r = innerRadius + (outerRadius - innerRadius) * 0.55
                  const x = cx + r * Math.cos(-midAngle * RADIAN)
                  const y = cy + r * Math.sin(-midAngle * RADIAN)

                  return (
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={12}
                      fill="var(--background)"
                      stroke="none"
                      className="pointer-events-none"
                    >
                      {abbrev(String(name))}
                    </text>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* LEGEND */}
        <div className="w-full space-y-2 text-sm">
          {transformedData.map((item) => {
            const pct = total ? ((item.visitors / total) * 100).toFixed(1) : "0.0"

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
                  {item.visitors} ({pct}%)
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
