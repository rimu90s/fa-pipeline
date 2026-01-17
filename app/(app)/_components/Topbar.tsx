"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppBreadcrumb from "./AppBreadcrumb";

const LS_KEY = "fa.sidebar.collapsed.v1";
const EVT = "fa:sidebar:toggle";

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

  // controlled by AppShell (single source of truth)
  sidebarCollapsed?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ---------------- Icons ---------------- */

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
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
      <path
        d="M10 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 9l-3 3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- Component ---------------- */

export default function Topbar({
  mobileNavOpen,
  onOpenMobileNav,
  onCloseMobileNav,
  sidebarCollapsed = false,
}: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function toggleSidebar() {
    try {
      const next = window.localStorage.getItem(LS_KEY) !== "1";
      window.localStorage.setItem(LS_KEY, next ? "1" : "0");
      window.dispatchEvent(new Event(EVT));
    } catch {}
  }

  function handleMobileToggle() {
    if (mobileNavOpen) onCloseMobileNav?.();
    else onOpenMobileNav?.();
  }

  async function onLogout() {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch {}
    router.replace("/login");
  }

  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
  const dur = "520ms";

  const btnBase =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold " +
    "transition-[transform,box-shadow,background-color] duration-200 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(43,89,255,0.26)] focus-visible:ring-offset-2";

  const btnGlass =
    "border border-[rgba(17,20,57,0.12)] bg-white/70 backdrop-blur-xl text-[color:rgba(17,20,57,0.78)] " +
    "hover:bg-white/80 active:scale-[0.99]";

  return (
    <header className="sticky top-0 z-20">
      {/* Glass shell */}
      <div className="relative border-b border-[rgba(17,20,57,0.10)] bg-white/65 backdrop-blur-xl">
        {/* specular highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-10 opacity-70"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.25), rgba(255,255,255,0))",
          }}
        />

        {/* subtle inner hairline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, rgba(17,20,57,0.00), rgba(17,20,57,0.10), rgba(17,20,57,0.00))",
          }}
        />

        <div className="flex w-full items-center justify-between px-4 py-3 md:px-6">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            {/* Desktop sidebar toggle */}
            <button
              type="button"
              onClick={toggleSidebar}
              className={cx(
                "hidden md:inline-flex",
                "relative h-11 w-11 items-center justify-center rounded-xl",
                "border border-[rgba(17,20,57,0.12)] bg-white/70 backdrop-blur-xl",
                "hover:bg-white/80",
                "active:scale-[0.99]",
                "transition-[transform,box-shadow,background-color] duration-200"
              )}
              style={{
                boxShadow: "0 12px 36px rgba(17,20,57,0.10)",
              }}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {/* halo glow */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 rounded-xl opacity-60"
                style={{
                  background:
                    "radial-gradient(120% 120% at 20% 15%, rgba(59,130,246,0.18), rgba(255,255,255,0) 62%)",
                  filter: "blur(10px)",
                }}
              />

              <span
                className={cx("inline-flex")}
                style={{
                  transition: `transform ${dur} ${easing}`,
                  willChange: "transform",
                  transform: sidebarCollapsed ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <IconChevron />
              </span>
            </button>

            {/* Mobile menu */}
            <button
              type="button"
              className={cx(
                "md:hidden",
                "inline-flex h-11 w-11 items-center justify-center rounded-xl",
                "border border-[rgba(17,20,57,0.12)] bg-white/70 backdrop-blur-xl hover:bg-white/80"
              )}
              style={{ boxShadow: "0 12px 36px rgba(17,20,57,0.10)" }}
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
              onClick={handleMobileToggle}
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

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            <Link href="/settings" className={cx(btnBase, btnGlass)} style={{ boxShadow: "0 12px 36px rgba(17,20,57,0.10)" }}>
              <IconGear />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            <button
              type="button"
              onClick={onLogout}
              className={cx(
                btnBase,
                "border border-red-200 bg-white/70 backdrop-blur-xl text-red-700 hover:bg-red-50/70 active:scale-[0.99]"
              )}
              style={{ boxShadow: "0 12px 36px rgba(17,20,57,0.10)" }}
            >
              <IconLogout />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* ultra subtle accent line (not neon) */}
        <div
          aria-hidden="true"
          className="h-px w-full opacity-70"
          style={{
            background:
              "linear-gradient(90deg, rgba(59,130,246,0.00), rgba(59,130,246,0.18), rgba(99,102,241,0.14), rgba(17,20,57,0.00))",
          }}
        />
      </div>
    </header>
  );
}
