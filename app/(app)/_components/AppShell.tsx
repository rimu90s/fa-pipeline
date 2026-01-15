"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function openSidebar() {
    setMobileOpen(true);
  }

  function closeSidebar() {
    setMobileOpen(false);
  }

  // ESC to close
  useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeSidebar();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  // prevent background scroll when drawer open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="relative min-h-dvh bg-[color:var(--bg)]">
      {/* App backdrop (subtle, premium) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 520px at 12% 12%, rgba(43,89,255,0.10) 0%, rgba(43,89,255,0) 60%)," +
              "radial-gradient(900px 520px at 88% 18%, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0) 62%)," +
              "radial-gradient(900px 560px at 50% 100%, rgba(17,20,57,0.08) 0%, rgba(17,20,57,0) 62%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-soft-light"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E')",
          }}
        />
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <Sidebar variant="desktop" />

        <div className="flex min-h-dvh flex-1 flex-col">
          <Topbar
            mobileNavOpen={mobileOpen}
            onOpenMobileNav={openSidebar}
            onCloseMobileNav={closeSidebar}
          />

          <main className="flex-1">
            {/* content container */}
            <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
              {/* Optional: make content sit on a subtle card for “ realize “enterprise app” vibe
                  If you feel too “boxed”, you can remove this wrapper.
              */}
              <div className="rounded-2xl border border-[rgba(17,20,57,0.10)] bg-white/70 backdrop-blur p-4 shadow-[0_18px_70px_rgba(17,20,57,0.06)] md:p-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeSidebar}
            className="absolute inset-0 bg-black/40"
          />
          {/* Drawer panel */}
          <div
            className={cx(
              "absolute inset-y-0 left-0 w-80 max-w-[88vw]",
              "shadow-[0_30px_120px_rgba(17,20,57,0.35)]"
            )}
          >
            <Sidebar variant="mobile" onNavigate={closeSidebar} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
