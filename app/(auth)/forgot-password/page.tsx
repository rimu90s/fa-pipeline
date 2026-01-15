"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/app/_lib/supabase-browser";
import { isValidEmail } from "@/app/_lib/form-helpers";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function emailError(email: string) {
  if (!email.trim()) return "Email wajib diisi.";
  if (!isValidEmail(email)) return "Format email tidak valid.";
  return null;
}

function humanize(raw: string) {
  const msg = (raw || "").toLowerCase();
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Terlalu banyak permintaan. Coba lagi beberapa saat.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Koneksi bermasalah. Coba cek internet Anda.";
  return raw || "Permintaan reset gagal. Coba lagi.";
}

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    if (!isCoarse) window.setTimeout(() => emailRef.current?.focus(), 120);
  }, []);

  // Auto-hide success (UX)
  useEffect(() => {
    if (!ok) return;
    const t = window.setTimeout(() => setOk(null), 6000);
    return () => window.clearTimeout(t);
  }, [ok]);

  const eErr = touched ? emailError(email) : null;
  const canSubmit = !emailError(email) && !loading;

  const inputBase =
    "h-11 w-full rounded-xl border bg-white/85 backdrop-blur px-4 text-sm " +
    "placeholder:text-[color:rgba(17,20,57,0.35)] " +
    "shadow-[inset_0_1px_0_rgba(17,20,57,0.04)] " +
    "transition-[box-shadow,border-color] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.28)] focus-visible:ring-offset-2";

  const btnBase =
    "relative inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold " +
    "transition-transform transition-[filter] duration-200 will-change-transform " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.30)] focus-visible:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:opacity-60";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setErr(null);
    setOk(null);
    setTouched(true);

    const ee = emailError(email);
    if (ee) return;

    setLoading(true);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    setLoading(false);

    if (error) {
      setErr(humanize(error.message));
      return;
    }

    setOk("Link reset password sudah dikirim. Silakan cek email (termasuk spam).");
  }

  return (
    <div className="relative isolate min-h-dvh bg-[color:var(--bg)]">
      {/* BACKDROP (same) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.74] blur-[1.5px] scale-[1.02]"
          style={{
            backgroundImage: "url(/images/auth/bg-auth-login.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "saturate(1.06) contrast(1.03)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(248,248,249,0.42) 0%, rgba(248,248,249,0.52) 55%, rgba(248,248,249,0.66) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 520px at 22% 28%, rgba(43,89,255,0.22) 0%, rgba(43,89,255,0) 60%)," +
              "radial-gradient(820px 520px at 78% 35%, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0) 62%)," +
              "radial-gradient(900px 560px at 52% 92%, rgba(17,20,57,0.10) 0%, rgba(17,20,57,0) 62%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-soft-light"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E')",
          }}
        />
        <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(to_right,rgba(17,20,57,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,20,57,0.10)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 700px at 50% 40%, rgba(255,255,255,0) 0%, rgba(248,248,249,0.22) 55%, rgba(17,20,57,0.14) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 md:grid-cols-2">
        <div className="hidden md:block animate-[authIn_.55s_ease-out_both]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(17,20,57,0.14)] bg-white/60 px-3 py-1 text-xs font-semibold backdrop-blur">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "linear-gradient(135deg, var(--grad-2), var(--grad-3))" }}
            />
            FA Pipeline
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[color:var(--fg)]">
            Forgot password
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:rgba(17,20,57,0.66)]">
            Masukkan email Anda. Kami akan kirim link reset password yang aman.
          </p>

          <div className="mt-6 text-xs text-[color:rgba(17,20,57,0.58)]">
            Tip: jika link tidak masuk, cek folder spam atau coba lagi setelah beberapa menit.
          </div>
        </div>

        <div className="w-full">
          <div className="mx-auto w-full max-w-md animate-[authIn_.55s_ease-out_both] [animation-delay:60ms]">
            <div className="relative rounded-3xl p-[1px] bg-[linear-gradient(135deg,rgba(43,89,255,0.38),rgba(139,92,246,0.26),rgba(17,20,57,0.10))] shadow-[0_35px_110px_rgba(17,20,57,0.18)]">
              <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-md p-7 ring-1 ring-[rgba(17,20,57,0.08)]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.60) 35%, rgba(255,255,255,0.86) 100%)",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[520px] -translate-x-1/2 rounded-full opacity-[0.55] blur-2xl"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)",
                  }}
                />

                <div className="relative">
                  <h2 className="text-xl font-semibold tracking-tight text-[color:var(--fg)]">
                    Send reset link
                  </h2>
                  <p className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">
                    We’ll send a reset link to your email.
                  </p>

                  <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--fg)]" htmlFor="fp-email">
                        Email
                      </label>
                      <input
                        ref={emailRef}
                        id="fp-email"
                        className={cx(
                          inputBase,
                          eErr
                            ? "border-red-300 focus-visible:ring-[rgba(239,68,68,0.28)]"
                            : "border-[color:rgba(17,20,57,0.14)]"
                        )}
                        value={email}
                        onChange={(e) => {
                          setErr(null);
                          setOk(null);
                          setEmail(e.target.value);
                        }}
                        onBlur={() => setTouched(true)}
                        autoComplete="email"
                        inputMode="email"
                        placeholder="name@company.com"
                        aria-invalid={!!eErr}
                        aria-describedby="fp-email-help"
                      />
                      <p
                        id="fp-email-help"
                        className={cx("text-xs", eErr ? "text-red-600" : "text-[color:rgba(17,20,57,0.58)]")}
                      >
                        {eErr ? eErr : "Gunakan email yang terdaftar di FA Pipeline."}
                      </p>
                    </div>

                    {err ? (
                      <div role="alert" aria-live="polite" className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2">
                        <div className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-0.5 text-amber-800">⚠️</span>
                          <p className="text-sm text-amber-900">{err}</p>
                        </div>
                      </div>
                    ) : null}

                    {ok ? (
                      <div role="status" aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2">
                        <div className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-0.5 text-emerald-800">✅</span>
                          <p className="text-sm text-emerald-900">{ok}</p>
                        </div>
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={cx(
                        btnBase,
                        "text-white shadow-[0_18px_50px_rgba(43,89,255,0.18)] active:translate-y-[0.5px] overflow-hidden",
                        canSubmit
                          ? "bg-[linear-gradient(135deg,#111439_0%,#2B59FF_55%,#8B5CF6_100%)] hover:brightness-[1.03] active:brightness-[0.98]"
                          : "bg-[linear-gradient(135deg,rgba(17,20,57,0.35)_0%,rgba(43,89,255,0.22)_55%,rgba(139,92,246,0.18)_100%)] text-white/80"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-60"
                        style={{
                          background:
                            "radial-gradient(500px 120px at 50% -10%, rgba(255,255,255,0.45), rgba(255,255,255,0) 70%)",
                        }}
                      />
                      {loading ? (
                        <span className="relative inline-flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white/90" />
                          Sending…
                        </span>
                      ) : (
                        <span className="relative">Send reset link</span>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:rgba(17,20,57,0.62)]">Remember your password?</span>
                      <Link
                        href="/login"
                        className="text-[color:var(--fg)] underline decoration-[rgba(17,20,57,0.25)] underline-offset-4 hover:opacity-90 hover:decoration-[rgba(17,20,57,0.45)]"
                      >
                        Back to login
                      </Link>
                    </div>

                    <div className="pt-1 text-xs text-[color:rgba(17,20,57,0.58)]">
                      If you don’t receive the email, check spam or try again later.
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 md:hidden animate-[authIn_.55s_ease-out_both] [animation-delay:90ms]">
            <div className="rounded-2xl border border-[color:rgba(17,20,57,0.14)] bg-white/65 p-5 backdrop-blur">
              <div className="text-sm font-semibold text-[color:var(--fg)]">FA Pipeline</div>
              <p className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">We’ll send a secure reset link.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
