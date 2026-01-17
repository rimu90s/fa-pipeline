// app/(app)/_components/StatCard.tsx
"use client";

type Tone = "blue" | "purple" | "emerald" | "neutral";

type Props = {
  title: string;
  value: string;
  subtitle?: string;
  hint?: string;
  tone?: Tone;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toneStyle(tone: Tone) {
  switch (tone) {
    case "blue":
      return {
        ring: "rgba(59,130,246,0.16)",
        rail: "rgba(59,130,246,0.55)",
        glow: "rgba(59,130,246,0.14)",
      };
    case "purple":
      return {
        ring: "rgba(139,92,246,0.16)",
        rail: "rgba(139,92,246,0.55)",
        glow: "rgba(139,92,246,0.12)",
      };
    case "emerald":
      return {
        ring: "rgba(16,185,129,0.16)",
        rail: "rgba(16,185,129,0.55)",
        glow: "rgba(16,185,129,0.12)",
      };
    default:
      return {
        ring: "rgba(17,20,57,0.12)",
        rail: "rgba(17,20,57,0.28)",
        glow: "rgba(17,20,57,0.10)",
      };
  }
}

export default function StatCard({ title, value, subtitle, hint, tone = "neutral" }: Props) {
  const t = toneStyle(tone);

  return (
    <div
      className={cx(
        "glass-card glass-hover group relative p-5",
        "transition-[transform,box-shadow,border-color] duration-300"
      )}
      style={{ borderColor: t.ring }}
    >
      {/* Accent rail (tipis, konsisten, tidak gradient wash) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-5 h-10 w-[3px] rounded-full opacity-60 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(180deg, ${t.rail}, rgba(255,255,255,0))`,
        }}
      />

      {/* Glow halus hanya saat hover (bukan neon) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(900px 320px at 18% 12%, ${t.glow}, rgba(255,255,255,0) 60%)`,
        }}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[color:rgba(17,20,57,0.78)]">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-muted">{subtitle}</div> : null}
        </div>

        {hint ? (
          <span className="pill" style={{ paddingTop: "0.22rem", paddingBottom: "0.22rem" }}>
            {hint}
          </span>
        ) : null}
      </div>

      <div className="relative z-10 mt-3 text-3xl font-semibold tracking-tight text-[color:rgba(17,20,57,0.92)]">
        {value}
      </div>
    </div>
  );
}
