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

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.7 7.7 0 0 0-1.7-1l-.4-2.6H9.1l-.4 2.6a7.7 7.7 0 0 0-1.7 1l-2.4-1-2 3.4L4.6 13a7.9 7.9 0 0 0-.1 1 7.9 7.9 0 0 0 .1 1l-2 1.5 2 3.4 2.4-1a7.7 7.7 0 0 0 1.7 1l.4 2.6h5.8l.4-2.6a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="2" />
      <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 9l-3 3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold " +
    "transition-[transform,filter] duration-200 will-change-transform " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.30)] focus-visible:ring-offset-2";

  return (
    <header className="sticky top-0 z-20 border-b border-[rgba(17,20,57,0.10)] bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={cx(
              "md:hidden",
              "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(17,20,57,0.10)] bg-white/70",
              "hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.30)] focus-visible:ring-offset-2"
            )}
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen ? true : false}
            onClick={() => {
              if (mobileNavOpen) onCloseMobileNav?.();
              else onOpenMobileNav?.();
            }}
          >
            <IconMenu />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="text-base font-semibold tracking-tight text-[color:var(--fg)]">
                {titleFromPath(pathname)}
              </div>
              <span className="hidden sm:inline-flex items-center rounded-full border border-[rgba(17,20,57,0.10)] bg-white/70 px-3 py-1 text-[11px] font-medium text-[color:rgba(17,20,57,0.70)]">
                Signed in
              </span>
            </div>
            <div className="mt-0.5">
              <AppBreadcrumb />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className={cx(
              btnBase,
              "border border-[rgba(17,20,57,0.12)] bg-white/80 text-[color:rgba(17,20,57,0.78)] hover:bg-white"
            )}
          >
            <IconGear />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className={cx(
              btnBase,
              "border border-red-200 bg-white/80 text-red-700 hover:bg-red-50"
            )}
          >
            <IconLogout />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* subtle bottom glow line */}
      <div
        aria-hidden="true"
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, rgba(43,89,255,0.0), rgba(43,89,255,0.22), rgba(139,92,246,0.18), rgba(17,20,57,0.0))",
        }}
      />
    </header>
  );
}
