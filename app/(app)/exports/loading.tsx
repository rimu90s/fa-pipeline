// app/(app)/exports/loading.tsx
import { SkeletonTable, SkeletonBlock } from "@/app/(app)/_components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-44" />
        <SkeletonBlock className="h-4 w-96" />
      </div>

      <div className="rounded-2xl border bg-white/80 backdrop-blur p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <SkeletonBlock className="h-11 w-44 rounded-xl" />
            <SkeletonBlock className="h-11 w-44 rounded-xl" />
          </div>
          <SkeletonBlock className="h-11 w-48 rounded-xl" />
        </div>
      </div>

      <SkeletonTable rows={7} cols={6} />
    </div>
  );
}
