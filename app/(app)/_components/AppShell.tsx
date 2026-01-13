"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="flex">
        <Sidebar />
        <div className="flex min-h-dvh flex-1 flex-col">
          <Topbar />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
