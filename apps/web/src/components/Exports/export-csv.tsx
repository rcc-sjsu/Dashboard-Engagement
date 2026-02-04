"use client";
import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { authenticatedFetch } from "@/lib/api-client";
import ChevronDown from "@/components/Icons/ChevronDown";
import OverviewIcon from "@/components/Icons/OverviewIcon";
import Users from "@/components/Icons/Users";
import TargetIcon from "@/components/Icons/TargetIcon";
import FileDownloadIcon from "@/components/Icons/FileDownloadIcon";
import DownloadIcon from "@/components/Icons/DownloadIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type ExportOption = "overview" | "retention" | "mission" | "all";
type ExportStatus = "idle" | "exporting" | "error";

const exportOptions: { value: ExportOption; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "retention", label: "Retention" },
  { value: "mission", label: "Mission" },
  { value: "all", label: "All Data" },
];

// Helper function to create and download a CSV file
const downloadCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Process and export data based on option
const processAndExport = (jsonData: any, option: ExportOption, date: string) => {
  if (option === "overview") {
    const { kpis, members_over_time } = jsonData.overview;
    
    // Export KPIs as single row
    downloadCSV([kpis], `overview-kpis-${date}.csv`);
    
    // Export members over time
    downloadCSV(members_over_time, `overview-members-over-time-${date}.csv`);
  }
  
  else if (option === "retention") {
    const { attendance_count_distribution_overall, attendance_count_distribution_by_major_category } = jsonData.retention;
    
    // Export overall distribution
    downloadCSV(
      attendance_count_distribution_overall,
      `retention-overall-distribution-${date}.csv`
    );
    
    // Export by major category - flatten the nested structure
    const byMajorFlattened = attendance_count_distribution_by_major_category.flatMap((category: any) =>
      category.distribution.map((item: any) => ({
        major_category: category.major_category,
        events_attended_bucket: item.events_attended_bucket,
        people: item.people
      }))
    );
    downloadCSV(
      byMajorFlattened,
      `retention-by-major-category-${date}.csv`
    );
  }
  
  else if (option === "mission") {
    const { major_category_distribution, class_year_distribution, event_major_category_percent } = jsonData.mission;
    
    // Export major category distribution
    downloadCSV(
      major_category_distribution,
      `mission-major-category-distribution-${date}.csv`
    );
    
    // Export class year distribution
    downloadCSV(
      class_year_distribution,
      `mission-class-year-distribution-${date}.csv`
    );
    
    // Export event major category percent - flatten segments
    const eventsFlattened = event_major_category_percent.flatMap((event: any) =>
      event.segments.map((segment: any) => ({
        event_id: event.event_id,
        event_title: event.event_title,
        starts_at: event.starts_at,
        total_attendees: event.total_attendees,
        major_category: segment.major_category,
        percentage: segment.pct,
        count: segment.count
      }))
    );
    downloadCSV(
      eventsFlattened,
      `mission-event-major-category-percent-${date}.csv`
    );
  }
};

const ExportCSV = () => {
  const [status, setStatus] = useState<ExportStatus>("idle");

  const handleExport = async (option: ExportOption) => {
    if (status === "exporting") return;

    const exportPromise = (async () => {
      setStatus("exporting");

      // Get current date for filename
      const date = new Date().toISOString().split("T")[0];

      if (option === "all") {
        // Fetch each endpoint separately for "all" option
        const endpoints = ["overview", "retention", "mission"];
        
        for (const endpoint of endpoints) {
          const response = await authenticatedFetch(`/analytics/${endpoint}`, {
            method: "GET",
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
          }
          
          const jsonData = await response.json();
          
          // Process and export each dataset
          processAndExport(jsonData, endpoint as ExportOption, date);
        }
        
        return "Successfully exported 7 CSV files";
      } else {
        // Fetch single endpoint
        const response = await authenticatedFetch(`/analytics/${option}`, {
          method: "GET",
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        
        const jsonData = await response.json();
        
        // Process and export based on option
        processAndExport(jsonData, option, date);
        
        const fileCount = option === "mission" ? 3 : 2;
        return `Successfully exported ${fileCount} CSV file${fileCount > 1 ? 's' : ''}`;
      }
    })();

    toast.promise(exportPromise, {
      loading: `Exporting ${option} data...`,
      success: (message) => {
        setStatus("idle");
        return message;
      },
      error: (error) => {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
        return `Export failed: ${error.message}`;
      },
    });
  };

  const isLoading = status === "exporting";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          disabled={isLoading}
          variant="outline"
          className="group"
        >
          {isLoading ? "Exporting..." : "Export CSV"}
          <ChevronDown className="ml-2 size-4 stroke-current transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" >
        <DropdownMenuLabel>Export CSV</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {exportOptions.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onSelect={() => handleExport(opt.value)}
            disabled={isLoading}
            className="group"
          >
            {opt.value === "overview" && (
              <OverviewIcon className="size-4 text-muted-foreground" />
            )}
            {opt.value === "retention" && (
              <Users className="size-4 text-muted-foreground" />
            )}
            {opt.value === "mission" && (
              <TargetIcon className="size-4 text-muted-foreground" />
            )}
            {opt.value === "all" && (
              <FileDownloadIcon className="size-4 text-muted-foreground" />
            )}
            {opt.label}
            <DownloadIcon className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportCSV;
