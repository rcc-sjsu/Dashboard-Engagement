import { Skeleton } from "@/components/ui/skeleton";

export function KPICardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-3 p-4 border rounded-lg">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="min-w-0 p-4 border rounded-lg">
      <Skeleton className="h-4 w-48 mb-4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function MissionSectionSkeleton() {
  return (
    <div className="min-w-0 p-4 border rounded-lg">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export function RetentionChartSkeleton() {
  return (
    <div className="min-w-0 p-4 border rounded-lg">
      <Skeleton className="h-4 w-48 mb-4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function AdminImportPanelSkeleton() {
  return (
    <div className="space-y-6 p-6 border rounded-lg">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

export function UsersTableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-3 border rounded-lg p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-3 border rounded-lg p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
