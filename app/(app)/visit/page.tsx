// app/(app)/visit/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import VisitShell from "./VisitShell";
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

function ReportSkin({ children }: { children: React.ReactNode }) {
  return (
    <div className="report-skin">
      {children}

      {/* IMPORTANT: plain <style> tag (NOT styled-jsx) so Server Component is OK */}
      <style>{`
        .report-skin {
          --r-border: rgba(17, 20, 57, 0.12);
          --r-muted: rgba(17, 20, 57, 0.58);
          --r-fg: rgba(17, 20, 57, 0.86);
          --r-bg: rgba(255, 255, 255, 0.72);
          --r-card: rgba(255, 255, 255, 0.78);
          --r-shadow: 0 22px 80px rgba(17, 20, 57, 0.08);
          --r-ring: rgba(43, 89, 255, 0.28);
          --r-grad: linear-gradient(135deg, #111439 0%, #2b59ff 55%, #8b5cf6 100%);
        }

        .report-skin h1,
        .report-skin h2,
        .report-skin h3 {
          color: var(--r-fg);
          letter-spacing: -0.01em;
        }
        .report-skin h1 {
          font-size: 22px;
          margin: 0 0 6px 0;
        }
        .report-skin h2 {
          font-size: 16px;
          margin: 18px 0 8px 0;
        }
        .report-skin p {
          color: var(--r-muted);
        }

        .report-skin form {
          background: var(--r-card);
          border: 1px solid var(--r-border);
          box-shadow: var(--r-shadow);
          padding: 18px;
          border-radius: 16px;
        }

        .report-skin label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(17, 20, 57, 0.78);
        }

        .report-skin input[type="text"],
        .report-skin input[type="number"],
        .report-skin input[type="date"],
        .report-skin select,
        .report-skin textarea {
          width: 100%;
          height: 44px;
          border-radius: 14px;
          border: 1px solid var(--r-border);
          background: rgba(255, 255, 255, 0.85);
          padding: 0 14px;
          font-size: 14px;
          color: var(--r-fg);
          outline: none;
          transition: box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .report-skin textarea {
          height: auto;
          min-height: 110px;
          padding: 12px 14px;
        }

        .report-skin input:focus,
        .report-skin select:focus,
        .report-skin textarea:focus {
          border-color: rgba(43, 89, 255, 0.35);
          box-shadow: 0 0 0 4px var(--r-ring);
        }

        .report-skin button,
        .report-skin input[type="submit"] {
          height: 44px;
          border-radius: 14px;
          border: 0;
          padding: 0 16px;
          font-weight: 700;
          color: #fff;
          background: var(--r-grad);
          box-shadow: 0 18px 50px rgba(43, 89, 255, 0.18);
          cursor: pointer;
          transition: transform 0.12s ease, filter 0.12s ease;
        }

        .report-skin button:hover,
        .report-skin input[type="submit"]:hover {
          filter: brightness(1.03);
        }

        .report-skin button:active,
        .report-skin input[type="submit"]:active {
          transform: translateY(1px);
          filter: brightness(0.98);
        }

        .report-skin table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          overflow: hidden;
          border: 1px solid var(--r-border);
          background: var(--r-bg);
          box-shadow: var(--r-shadow);
          border-radius: 16px;
        }

        .report-skin thead th {
          font-size: 12px;
          text-align: left;
          color: rgba(17, 20, 57, 0.72);
          background: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid var(--r-border);
          padding: 12px 14px;
          white-space: nowrap;
        }

        .report-skin tbody td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(17, 20, 57, 0.08);
          color: rgba(17, 20, 57, 0.78);
          font-size: 13px;
        }

        .report-skin tbody tr:hover td {
          background: rgba(43, 89, 255, 0.04);
        }
      `}</style>
    </div>
  );
}

export default async function AppVisitPage() {
  await requireSessionOrRedirect();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[rgba(17,20,57,0.10)] bg-white/70 backdrop-blur p-4">
        <div className="text-sm font-semibold text-[color:rgba(17,20,57,0.86)]">Visit</div>
        <div className="mt-1 text-sm text-[color:rgba(17,20,57,0.58)]">
          Input visit event dan pantau histori kunjungan per unit kerja. Jika tabel masih kosong, artinya belum ada data pada rentang tanggal tersebut.
        </div>
      </div>

      <Suspense fallback={<VisitSkeleton />}>
        <ReportSkin>
          <VisitShell>
            <VisitPage />
          </VisitShell>
        </ReportSkin>
      </Suspense>
    </div>
  );
}
