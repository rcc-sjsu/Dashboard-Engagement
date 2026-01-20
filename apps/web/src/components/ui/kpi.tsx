"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BigNumber({
  title,
  date,
  value,
  trending,
  trendText,
  trendUp,
}: {
  title: string;
  date: string;
  value: number | string;
  trending: boolean;
  trendText?: string;
  trendUp?: boolean;
}) {
  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{date}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="text-5xl font-bold tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        {trending ? (
          <div className="flex gap-2 leading-none font-medium">
            {trendText ?? "Trending"}
            {trendUp === false ? (
              <TrendingDown className="h-4 w-4 text-red-700" />
            ) : (
              <TrendingUp className="h-4 w-4 text-green-700" />
            )}
          </div>
        ) : null}
      </CardFooter>
    </Card>
  );
}
