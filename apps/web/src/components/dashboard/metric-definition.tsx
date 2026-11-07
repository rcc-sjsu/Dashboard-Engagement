"use client";

import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type MetricDefinitionProps = {
  title: string;
  definition: string;
  methodologyHref?: string;
};

export function MetricDefinition({
  title,
  definition,
  methodologyHref,
}: MetricDefinitionProps) {
  const paragraphs = definition.split(/\n+/).filter((paragraph) => paragraph.trim());

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto gap-1.5 px-0 py-1 text-muted-foreground"
          aria-label={`View definition for ${title}`}
        >
          <Info className="size-4" aria-hidden="true" />
          View definition
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Definition and eligibility</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <DialogFooter>
          {methodologyHref ? (
            <Button variant="link" size="sm" asChild>
              <a href={methodologyHref}>Full methodology</a>
            </Button>
          ) : null}
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
