"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Label, Pie, PieChart, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const growthChannelsData = [
  { name: "Referrals", value: 380, color: "var(--chart-1)" },
  { name: "Events", value: 290, color: "var(--chart-2)" },
  { name: "Social", value: 210, color: "var(--chart-3)" },
  { name: "Partnerships", value: 160, color: "var(--chart-4)" },
  { name: "Walk-ins", value: 110, color: "var(--chart-5)" },
];

const growthChannelsConfig = growthChannelsData.reduce((acc, item) => {
  const key = item.name.toLowerCase().replace(/\s+/g, "-");
  acc[key] = { label: item.name, color: item.color };
  return acc;
}, {} as ChartConfig);

const growthChannelsChartData = growthChannelsData.map((item) => ({
  name: item.name,
  value: item.value,
  fill: `var(--color-${item.name.toLowerCase().replace(/\s+/g, "-")})`,
}));

const clubGrowthData = [
  { month: "Jan", members: 48, attendance: 132 },
  { month: "Feb", members: 62, attendance: 148 },
  { month: "Mar", members: 79, attendance: 171 },
  { month: "Apr", members: 101, attendance: 196 },
  { month: "May", members: 124, attendance: 221 },
  { month: "Jun", members: 147, attendance: 249 },
];

const clubGrowthConfig = {
  members: { label: "New Members", color: "var(--chart-1)" },
  attendance: { label: "Event Attendance", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function AuthGrowthChannelsChart() {
  const total = React.useMemo(
    () => growthChannelsData.reduce((acc, curr) => acc + curr.value, 0),
    [],
  );

  return (
    <Card className="overflow-hidden rounded-3xl">
      <CardHeader className="items-center pb-0">
        <CardTitle>Growth Channels</CardTitle>
        <CardDescription>Last 90 days</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={growthChannelsConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={growthChannelsChartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                        {total.toLocaleString()}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                        New Members
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Referrals drive the biggest lift <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Member acquisition is diverse and expanding
        </div>
      </CardFooter>
    </Card>
  );
}

export function AuthClubGrowthChart() {
  return (
    <Card className="overflow-hidden rounded-3xl">
      <CardHeader>
        <CardTitle>Club Growth</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={clubGrowthConfig}>
          <BarChart accessibilityLayer data={clubGrowthData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="members" fill="var(--color-members)" radius={6} />
            <Bar dataKey="attendance" fill="var(--color-attendance)" radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Momentum is building across the club <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Membership and attendance are growing together
        </div>
      </CardFooter>
    </Card>
  );
}
