"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

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
    <div className="min-h-dvh bg-background">
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
            <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
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
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] shadow-xl">
            <Sidebar variant="mobile" onNavigate={closeSidebar} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
