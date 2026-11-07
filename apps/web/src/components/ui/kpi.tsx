"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { MetricDefinition } from "@/components/dashboard/metric-definition";

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
  detail,
  definition,
  summary,
  definitionTitle,
  methodologyHref,
  valueSuffix,
}: {
  title: string;
  date: string;
  value: number | string;
  trending: boolean;
  trendText?: string;
  trendUp?: boolean;
  detail?: string;
  definition?: string;
  summary?: string;
  definitionTitle?: string;
  methodologyHref?: string;
  valueSuffix?: string;
}) {
  return (
    <Card className="h-full w-full min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{date}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {valueSuffix ? <span className="text-sm text-muted-foreground">{valueSuffix}</span> : null}
        </div>
        {detail ? <p className="mt-2 text-sm text-muted-foreground">{detail}</p> : null}
        {summary ? <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{summary}</p> : null}
      </CardContent>

      {definition || trending ? <CardFooter className="mt-auto flex-col items-start gap-2 text-sm">
        {trending ? (
          <div className="flex items-center gap-2 font-medium">
            {trendText ?? "Trending"}
            {trendUp === false ? (
              <TrendingDown className="h-4 w-4 text-red-700" />
            ) : (
              <TrendingUp className="h-4 w-4 text-green-700" />
            )}
          </div>
        ) : null}
        {definition ? (
          <MetricDefinition
            title={definitionTitle ?? title}
            definition={definition}
            methodologyHref={methodologyHref}
          />
        ) : null}
      </CardFooter> : null}
    </Card>
  );
}
