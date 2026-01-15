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

type TopbarProps = {
  mobileNavOpen?: boolean;
  onOpenMobileNav?: () => void;
  onCloseMobileNav?: () => void;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Topbar({
  mobileNavOpen,
  onOpenMobileNav,
  onCloseMobileNav,
}: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function onLogout() {
    try {
      // IMPORTANT: real sign-out (remove Supabase cookies)
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch {
      // ignore network error
    } finally {
      router.replace("/login");
    }
  }

  const btnBase =
    "rounded-lg px-3 py-2 text-sm hover:bg-zinc-50 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={cx(
              "md:hidden",
              "inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-zinc-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            )}
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen ? true : false}
            onClick={() => {
              if (mobileNavOpen) onCloseMobileNav?.();
              else onOpenMobileNav?.();
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="flex flex-col">
            <div className="text-base font-semibold">{titleFromPath(pathname)}</div>
            <div className="mt-0.5">
              <AppBreadcrumb />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Link href="/settings" className={btnBase}>
            Settings
          </Link>
          <button type="button" onClick={onLogout} className={btnBase}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
