"use client"

import { TrendingUp } from "lucide-react"
import { ResponsiveContainer, LabelList, Pie, PieChart } from "recharts"

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
import { ToggleBar } from "@/components/ui/toggle"

export const description = "A pie chart with a label list"

interface ChartPieLabelListProps {
  data?: Array<{
    name: string;
    value: number;
  }>;
  title?: string;
  description?: string;
}

export function ChartPieLabelList({ 
  data,
  title = "Pie Chart - Label List",
  description = "January - June 2024"
}: ChartPieLabelListProps) {
  // Transform data and create dynamic config
  const transformedData = data ? data.map((item, index) => ({
    category: item.name,
    visitors: item.value,
    fill: `var(--chart-${(index % 5) + 1})`
  })) : [
    { category: "chrome", visitors: 275, fill: "var(--chart-1)" },
    { category: "safari", visitors: 200, fill: "var(--chart-2)" },
    { category: "firefox", visitors: 187, fill: "var(--chart-3)" },
    { category: "edge", visitors: 173, fill: "var(--chart-4)" },
    { category: "other", visitors: 90, fill: "var(--chart-5)" },
  ];

  // Create dynamic chart config
  const chartConfig = transformedData.reduce((acc, item, index) => {
    acc[item.category] = {
      label: item.category,
      color: `var(--chart-${(index % 5) + 1})`,
    };
    return acc;
  }, { visitors: { label: "Visitors" } } as ChartConfig);

  return (
    <ResponsiveContainer width="100%" height="100%">
    <Card className="flex flex-col h-full justify-between">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <ToggleBar></ToggleBar>

      <CardContent className="flex flex-1 pt-4">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="visitors" hideLabel />}
            />
            <Pie data={transformedData} dataKey="visitors">
              <LabelList
                dataKey="category"
                className="fill-background"
                stroke="none"
                fontSize={12}
                formatter={(value: keyof typeof chartConfig) =>
                  chartConfig[value]?.label
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
    </ResponsiveContainer>
  )
}