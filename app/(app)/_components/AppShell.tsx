"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type Props = {
  children: React.ReactNode;
};

const LS_KEY = "fa.sidebar.collapsed.v1";
const EVT = "fa:sidebar:toggle";

function readCollapsedSafe() {
  try {
    return window.localStorage.getItem(LS_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AppShell({ children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // single source of truth (hydrated from storage)
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;

    const defer =
      typeof queueMicrotask === "function"
        ? queueMicrotask
        : (cb: () => void) => Promise.resolve().then(cb);

    const syncFromStorage = () => {
      defer(() => {
        if (!alive) return;
        setCollapsed(readCollapsedSafe());
        setHydrated(true);
      });
    };

    // hydrate after mount (avoid hydration mismatch)
    syncFromStorage();

    window.addEventListener(EVT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);

    return () => {
      alive = false;
      window.removeEventListener(EVT, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // IMPORTANT: keep SSR deterministic (expanded first paint)
  const collapsedView = hydrated ? collapsed : false;

  // geometry
  const sidebarW = collapsedView ? 92 : 288;

  // premium easing
  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
  const dur = "520ms";

  // premium canvas: clean, futuristic, subtle depth (no noisy dirt)
  const canvas = useMemo(() => {
    const base = "rgba(247,248,252,1)";

    // subtle micro-grid (very low contrast) — gives depth without “kotor”
    const microGrid =
      "linear-gradient(to right, rgba(17,20,57,0.028) 1px, rgba(255,255,255,0) 1px), " +
      "linear-gradient(to bottom, rgba(17,20,57,0.028) 1px, rgba(255,255,255,0) 1px)";

    // soft wash + controlled glows
    const glows = [
      "radial-gradient(1200px 680px at 16% 6%, rgba(59,130,246,0.14), rgba(255,255,255,0) 62%)",
      "radial-gradient(1100px 680px at 84% 8%, rgba(99,102,241,0.12), rgba(255,255,255,0) 62%)",
      "radial-gradient(900px 520px at 52% 112%, rgba(17,20,57,0.07), rgba(255,255,255,0) 64%)",
    ].join(",");

    // top specular highlight (kaca terasa “mahal”)
    const topHighlight =
      "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.28), rgba(255,255,255,0.00))";

    // gentle vignette to frame the content
    const vignette = "radial-gradient(1400px 900px at 50% 40%, rgba(0,0,0,0), rgba(17,20,57,0.06) 72%)";

    return { base, microGrid, glows, topHighlight, vignette };
  }, []);

  return (
    <div className="min-h-dvh">
      {/* PREMIUM CLEAN CANVAS */}
      <div className="fixed inset-0 -z-10">
        {/* Base */}
        <div className="absolute inset-0" style={{ background: canvas.base }} />

        {/* Micro grid — super subtle */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: canvas.microGrid,
            backgroundSize: "72px 72px",
          }}
        />

        {/* Soft wash & glows */}
        <div className="absolute inset-0" style={{ background: canvas.glows }} />

        {/* Specular highlight */}
        <div
          className="absolute inset-x-0 top-0 h-[420px] opacity-60"
          style={{ background: canvas.topHighlight }}
        />

        {/* Vignette */}
        <div className="absolute inset-0" style={{ background: canvas.vignette }} />
      </div>

      <div className="flex min-h-dvh">
        {/* Desktop sidebar (fixed) */}
        <div
          className="hidden md:block md:fixed md:inset-y-0 md:left-0"
          style={{
            width: sidebarW,
            transition: `width ${dur} ${easing}`,
            willChange: "width",
          }}
        >
          <div
            className="h-full border-r border-[rgba(17,20,57,0.10)] bg-white/70 backdrop-blur-xl"
            style={{
              boxShadow: "0 24px 90px rgba(17,20,57,0.10)",
            }}
          >
            {/* inner width keeps feel “solid” */}
            <div
              className="h-full"
              style={{
                width: sidebarW,
                transition: `width ${dur} ${easing}`,
                willChange: "width",
              }}
            >
              <Sidebar variant="desktop" collapsed={collapsedView} />
            </div>
          </div>
        </div>

        {/* Main column */}
        <div
          className="flex min-h-dvh w-full flex-col"
          style={{
            paddingLeft: sidebarW,
            transition: `padding-left ${dur} ${easing}`,
            willChange: "padding-left",
          }}
        >
          <Topbar
            mobileNavOpen={mobileOpen}
            onOpenMobileNav={() => setMobileOpen(true)}
            onCloseMobileNav={() => setMobileOpen(false)}
            sidebarCollapsed={collapsedView}
          />

          <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
            {/* content glass frame (very subtle) */}
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-2 -z-10 rounded-[28px] opacity-60"
                style={{
                  background:
                    "radial-gradient(900px 320px at 20% 0%, rgba(99,102,241,0.10), rgba(255,255,255,0) 62%)",
                  filter: "blur(10px)",
                }}
              />
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[320px]">
            <div
              className="h-full border-r border-[rgba(17,20,57,0.10)] bg-white/80 backdrop-blur-xl"
              style={{ boxShadow: "0 28px 110px rgba(17,20,57,0.16)" }}
            >
              <Sidebar variant="mobile" collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
