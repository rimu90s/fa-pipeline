// app/(app)/visit/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

async function requireSessionOrRedirect() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) redirect("/login");

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/login");
}

export default async function AppVisitPage() {
  await requireSessionOrRedirect();

  return (
    <Suspense fallback={<VisitSkeleton />}>
      <VisitPage />
    </Suspense>
  );
}
