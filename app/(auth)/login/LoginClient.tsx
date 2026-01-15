"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidEmail, minLen } from "@/app/_lib/form-helpers";
import { getAuthRedirectFromQuery } from "@/app/_lib/auth-redirect";

type FormState = { email: string; password: string };
type FieldErrors = { email?: string; password?: string };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function humanizeAuthErr(raw: string) {
  const msg = (raw || "").toLowerCase();
  if (msg.includes("invalid") && msg.includes("credentials"))
    return "Email atau password salah.";
  if (msg.includes("invalid") && msg.includes("login"))
    return "Email atau password salah.";
  if (msg.includes("not confirmed") || msg.includes("confirm"))
    return "Email belum terverifikasi. Cek inbox/spam untuk verifikasi.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Terlalu banyak percobaan. Coba lagi beberapa saat.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Koneksi bermasalah. Coba cek internet Anda.";
  return raw || "Login gagal. Coba lagi.";
}

function isCapsLockOn(e: React.KeyboardEvent<HTMLInputElement>) {
  return e.getModifierState?.("CapsLock") ?? false;
}

function IconCheck({ tone = "blue" }: { tone?: "blue" | "purple" | "navy" }) {
  const color =
    tone === "blue"
      ? "rgba(43,89,255,0.85)"
      : tone === "purple"
        ? "rgba(139,92,246,0.82)"
        : "rgba(17,20,57,0.72)";
  const bg =
    tone === "blue"
      ? "rgba(43,89,255,0.12)"
      : tone === "purple"
        ? "rgba(139,92,246,0.12)"
        : "rgba(17,20,57,0.08)";
  return (
    <span
      className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full"
      style={{ background: bg, color }}
      aria-hidden="true"
    >
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path
          d="M7.8 14.2 3.9 10.3a1 1 0 0 1 1.4-1.4l2.5 2.5 6.9-6.9a1 1 0 1 1 1.4 1.4l-8.3 8.3Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  const [showPass, setShowPass] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailId = "login-email";
  const passId = "login-password";
  const errorId = "login-error";

  const emailOk = isValidEmail(form.email);
  const passOk = minLen(form.password, 8);
  const canSubmit = emailOk && passOk && !loading;

  const fieldErrors: FieldErrors = useMemo(() => {
    const e: FieldErrors = {};
    if (touched.email && !emailOk) e.email = "Format email tidak valid.";
    if (touched.password && !passOk) e.password = "Password minimal 8 karakter.";
    return e;
  }, [touched.email, touched.password, emailOk, passOk]);

  const inputBase =
    "h-11 w-full rounded-xl border bg-white/85 backdrop-blur px-4 text-sm " +
    "placeholder:text-[color:rgba(17,20,57,0.35)] " +
    "shadow-[inset_0_1px_0_rgba(17,20,57,0.04)] " +
    "transition-[box-shadow,border-color,transform] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.28)] focus-visible:ring-offset-2";

  const btnBase =
    "relative inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold " +
    "transition-[filter,transform] duration-200 will-change-transform " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.30)] focus-visible:ring-offset-2 " +
    "active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-60 overflow-hidden";

  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    if (!isCoarse) window.setTimeout(() => emailRef.current?.focus(), 140);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setTouched({ email: true, password: true });

    if (!emailOk) return setError("Format email tidak valid.");
    if (!passOk) return setError("Password minimal 8 karakter.");

    setLoading(true);

    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.email.trim(),
        password: form.password,
      }),
    }).catch(() => null);

    setLoading(false);

    if (!res) return setError("Network error. Please try again.");
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      return setError(humanizeAuthErr(j?.error || "Login failed."));
    }

    const next = getAuthRedirectFromQuery(new URLSearchParams(sp.toString()));
    router.replace(next || "/");
  }

  const disabledReason = loading
    ? "Sedang masuk…"
    : !form.email.trim() || !form.password
      ? "Masukkan email & password."
      : !emailOk
        ? "Periksa format email."
        : !passOk
          ? "Password minimal 8 karakter."
          : null;

  return (
    <div className="relative isolate min-h-dvh bg-[color:var(--bg)]">
      {/* PREMIUM BACKDROP */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
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
        {/* LEFT (desktop) */}
        <div className="hidden md:block animate-[authIn_.55s_ease-out_both]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(17,20,57,0.14)] bg-white/60 px-3 py-1 text-xs font-semibold backdrop-blur">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "linear-gradient(135deg, var(--grad-2), var(--grad-3))" }}
            />
            FA Pipeline
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[color:var(--fg)]">
            Welcome back
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:rgba(17,20,57,0.66)]">
            Sign in to manage{" "}
            <span className="font-semibold text-[color:var(--fg)]">Visits</span>,{" "}
            <span className="font-semibold text-[color:var(--fg)]">Leads</span>, and{" "}
            <span className="font-semibold text-[color:var(--fg)]">Exports</span> with audit-ready reporting.
          </p>

          <div className="mt-8 overflow-hidden rounded-3xl border border-[color:rgba(17,20,57,0.14)] bg-white/60 backdrop-blur">
            <div className="relative px-6 py-6">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1"
                style={{
                  background: "linear-gradient(90deg, var(--grad-2), var(--grad-3), var(--grad-2))",
                }}
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[color:var(--fg)]">What you can do</div>
                  <span className="rounded-full border border-[color:rgba(17,20,57,0.14)] bg-white/80 px-2 py-0.5 text-[11px] font-medium text-[color:rgba(17,20,57,0.70)]">
                    Logged & compliant
                  </span>
                </div>

                <ul className="mt-4 space-y-3 text-sm text-[color:rgba(17,20,57,0.66)]">
                  <li className="flex items-start gap-3">
                    <IconCheck tone="blue" />
                    Record daily visits and activity metrics.
                  </li>
                  <li className="flex items-start gap-3">
                    <IconCheck tone="purple" />
                    Track daily and weekly leads summary.
                  </li>
                  <li className="flex items-start gap-3">
                    <IconCheck tone="navy" />
                    Export CSV / Excel for reporting & audit.
                  </li>
                </ul>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-[color:rgba(17,20,57,0.12)] bg-white/85 px-3 py-3">
                    <div className="text-xs font-semibold text-[color:var(--fg)]">Secure</div>
                    <div className="mt-1 text-xs text-[color:rgba(17,20,57,0.60)]">Cookie auth</div>
                  </div>
                  <div className="rounded-2xl border border-[color:rgba(17,20,57,0.12)] bg-white/85 px-3 py-3">
                    <div className="text-xs font-semibold text-[color:var(--fg)]">Role-based</div>
                    <div className="mt-1 text-xs text-[color:rgba(17,20,57,0.60)]">RBAC enforced</div>
                  </div>
                  <div className="rounded-2xl border border-[color:rgba(17,20,57,0.12)] bg-white/85 px-3 py-3">
                    <div className="text-xs font-semibold text-[color:var(--fg)]">Fast</div>
                    <div className="mt-1 text-xs text-[color:rgba(17,20,57,0.60)]">PWA-ready</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-[color:rgba(17,20,57,0.58)]">
            Tip: gunakan email perusahaan untuk akses workspace.
          </div>
        </div>

        {/* RIGHT: FORM */}
        <div className="w-full">
          <div className="mx-auto w-full max-w-md animate-[authIn_.55s_ease-out_both] [animation-delay:70ms]">
            <div className="relative rounded-3xl p-[1px] bg-[linear-gradient(135deg,rgba(43,89,255,0.40),rgba(139,92,246,0.26),rgba(17,20,57,0.10))] shadow-[0_35px_110px_rgba(17,20,57,0.18)] transition-transform duration-300 will-change-transform hover:-translate-y-1">
              <div className="relative overflow-hidden rounded-3xl bg-white/85 p-7 ring-1 ring-[rgba(17,20,57,0.08)] backdrop-blur-md">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.58) 35%, rgba(255,255,255,0.86) 100%)",
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
                    Login
                  </h2>
                  <p className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">
                    Enter your credentials to continue.
                  </p>

                  <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
                    {/* Email */}
                    <div className="space-y-2">
                      <label htmlFor={emailId} className="text-sm font-medium text-[color:var(--fg)]">
                        Email
                      </label>
                      <input
                        ref={emailRef}
                        id={emailId}
                        name="email"
                        className={cx(
                          inputBase,
                          fieldErrors.email
                            ? "border-red-300 focus-visible:ring-[rgba(239,68,68,0.28)]"
                            : "border-[color:rgba(17,20,57,0.14)]"
                        )}
                        value={form.email}
                        onChange={(e) => {
                          setError(null);
                          setForm((s) => ({ ...s, email: e.target.value }));
                        }}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        autoComplete="email"
                        inputMode="email"
                        placeholder="name@company.com"
                        aria-invalid={!!fieldErrors.email}
                        aria-describedby={`${emailId}-help`}
                      />
                      <p
                        id={`${emailId}-help`}
                        className={cx(
                          "text-xs",
                          fieldErrors.email ? "text-red-600" : "text-[color:rgba(17,20,57,0.58)]"
                        )}
                      >
                        {fieldErrors.email ? fieldErrors.email : "Gunakan email perusahaan untuk akses workspace."}
                      </p>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label htmlFor={passId} className="text-sm font-medium text-[color:var(--fg)]">
                          Password
                        </label>
                        <Link
                          href="/forgot-password"
                          className="text-sm text-[color:rgba(17,20,57,0.62)] underline decoration-[rgba(17,20,57,0.25)] underline-offset-4 hover:text-[color:var(--fg)] hover:decoration-[rgba(17,20,57,0.45)]"
                        >
                          Forgot password?
                        </Link>
                      </div>

                      <div className="relative">
                        <input
                          id={passId}
                          name="password"
                          className={cx(
                            inputBase,
                            "pr-14",
                            fieldErrors.password
                              ? "border-red-300 focus-visible:ring-[rgba(239,68,68,0.28)]"
                              : "border-[color:rgba(17,20,57,0.14)]"
                          )}
                          type={showPass ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => {
                            setError(null);
                            setForm((s) => ({ ...s, password: e.target.value }));
                          }}
                          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                          onKeyUp={(e) => setCapsOn(isCapsLockOn(e))}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          aria-invalid={!!fieldErrors.password}
                          aria-describedby={`${passId}-help`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[color:rgba(17,20,57,0.65)] hover:bg-[rgba(17,20,57,0.06)]"
                        >
                          {showPass ? "Hide" : "Show"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span
                          id={`${passId}-help`}
                          className={cx(
                            "text-[color:rgba(17,20,57,0.58)]",
                            fieldErrors.password && "text-red-600"
                          )}
                        >
                          {fieldErrors.password ? fieldErrors.password : "Password minimal 8 karakter."}
                        </span>
                        <span className="text-[color:rgba(17,20,57,0.58)]">{passOk ? "✓" : ""}</span>
                      </div>

                      {capsOn ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-900">
                          Caps Lock aktif.
                        </div>
                      ) : null}
                    </div>

                    {/* Error */}
                    {error ? (
                      <div
                        id={errorId}
                        role="alert"
                        aria-live="polite"
                        className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2"
                      >
                        <div className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-0.5 text-amber-800">⚠️</span>
                          <p className="text-sm text-amber-900">{error}</p>
                        </div>
                      </div>
                    ) : null}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={cx(
                        btnBase,
                        "text-white shadow-[0_18px_50px_rgba(43,89,255,0.18)]",
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
                            "radial-gradient(520px 120px at 50% -10%, rgba(255,255,255,0.45), rgba(255,255,255,0) 70%)",
                        }}
                      />
                      {loading ? (
                        <span className="relative inline-flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white/90" />
                          Signing in…
                        </span>
                      ) : (
                        <span className="relative">Sign in</span>
                      )}
                    </button>

                    {disabledReason ? (
                      <div className="text-xs text-[color:rgba(17,20,57,0.58)]">{disabledReason}</div>
                    ) : null}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:rgba(17,20,57,0.62)]">New here?</span>
                      <Link
                        href="/register"
                        className="text-[color:var(--fg)] underline decoration-[rgba(17,20,57,0.25)] underline-offset-4 hover:opacity-90 hover:decoration-[rgba(17,20,57,0.45)]"
                      >
                        Create account
                      </Link>
                    </div>

                    <div className="pt-1 text-xs text-[color:rgba(17,20,57,0.58)]">
                      By continuing, you agree to keep your account credentials secure.
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile note */}
          <div className="mt-6 md:hidden animate-[authIn_.55s_ease-out_both] [animation-delay:95ms]">
            <div className="rounded-2xl border border-[color:rgba(17,20,57,0.14)] bg-white/65 p-5 backdrop-blur">
              <div className="text-sm font-semibold text-[color:var(--fg)]">FA Pipeline</div>
              <p className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">
                Secure reporting for visits, leads, and exports.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
