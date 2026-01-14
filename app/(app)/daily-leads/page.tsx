// app/(app)/daily-leads/page.tsx
import { Suspense } from "react";
import DailyLeadsPage from "@/app/(report)/_report/daily-leads/page";
import { SkeletonTable } from "@/app/(app)/_components/Skeleton";

function DailyLeadsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="h-6 w-52 animate-pulse rounded bg-muted/60" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted/60" />
      </div>
      <SkeletonTable rows={7} cols={6} />
    </div>
  );
}

export default function AppDailyLeadsPage() {
  return (
    <Suspense fallback={<DailyLeadsSkeleton />}>
      <DailyLeadsPage />
    </Suspense>
  );
}
