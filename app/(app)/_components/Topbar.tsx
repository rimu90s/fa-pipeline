"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppBreadcrumb from "./AppBreadcrumb";

function titleFromPath(pathname: string) {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/visit")) return "Visit";
  if (pathname.startsWith("/daily-leads")) return "Daily Leads";
  if (pathname.startsWith("/exports")) return "Exports";
  if (pathname.startsWith("/settings")) return "Settings";
  return "App";
}

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function onLogout() {
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        {/* Left: title + breadcrumb */}
        <div className="flex flex-col">
          <div className="text-base font-semibold">{titleFromPath(pathname)}</div>
          <div className="mt-0.5">
            <AppBreadcrumb />
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="rounded-lg px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
