"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SemesterOption = {
  value: string;
  label: string;
  start_date?: string;
  end_date?: string;
};

interface SemesterFilterProps {
  options: SemesterOption[];
  value: string;
}

export function SemesterFilter({ options, value }: SemesterFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onValueChange = (nextValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue === "all") {
      params.delete("semester");
    } else {
      params.set("semester", nextValue);
    }

    const query = params.toString();
    router.replace((query ? `${pathname}?${query}` : pathname) as any);
  };

  return (
    <div className="w-full sm:w-[330px]">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label="Select semester">
          <SelectValue placeholder="Select semester" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
