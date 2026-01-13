"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function labelize(seg: string) {
  // sederhana dan aman: "daily-leads" -> "Daily Leads"
  return seg
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Props = {
  homeLabel?: string;
};

export default function AppBreadcrumb({ homeLabel = "Dashboard" }: Props) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  // "/" => hanya Home
  if (parts.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="text-sm">
        <span className="text-muted-foreground">{homeLabel}</span>
      </nav>
    );
  }

  const crumbs = parts.map((seg, idx) => {
    const href = "/" + parts.slice(0, idx + 1).join("/");
    const last = idx === parts.length - 1;
    return { seg, href, last };
  });

  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="text-muted-foreground hover:underline">
            {homeLabel}
          </Link>
        </li>
        {crumbs.map((c) => (
          <li key={c.href} className="flex items-center gap-1">
            <span className="text-muted-foreground">/</span>
            {c.last ? (
              <span className="font-medium">{labelize(c.seg)}</span>
            ) : (
              <Link href={c.href} className="text-muted-foreground hover:underline">
                {labelize(c.seg)}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
