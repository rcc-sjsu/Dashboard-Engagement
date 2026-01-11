"use client"

import { TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface BigNumberProps {
  title?: string;
  description?: string;
  value: number | string;
  trend?: string;
  trendValue?: number;
  showTrend?: boolean;
}

export function BigNumber({ 
  title = "Total Visitors",
  description = "January – June 2024",
  value,
  trend,
  trendValue,
  showTrend = false
}: BigNumberProps) {
  // Handle both number and string values
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="text-5xl font-bold tracking-tight">
          {displayValue}
        </div>
      </CardContent>

      {showTrend && (trend || trendValue !== undefined) && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            {trend || `Trending up by ${trendValue}% this month`} <TrendingUp className="h-4 w-4" />
          </div>
        </CardFooter>
      )}
    </Card>
  )
}