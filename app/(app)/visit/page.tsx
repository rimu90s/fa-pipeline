// app/(app)/visit/page.tsx
import { Suspense } from "react";
import VisitPage from "@/app/(report)/_report/visit/page";
import { SkeletonTable } from "@/app/(app)/_components/Skeleton";

function VisitSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="h-6 w-40 animate-pulse rounded bg-muted/60" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted/60" />
      </div>
      <SkeletonTable rows={7} cols={6} />
    </div>
  );
}

export default function AppVisitPage() {
  return (
    <Suspense fallback={<VisitSkeleton />}>
      <VisitPage />
    </Suspense>
  );
}
