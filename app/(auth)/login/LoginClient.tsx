"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidEmail, minLen } from "@/app/_lib/form-helpers";
import { getAuthRedirectFromQuery } from "@/app/_lib/auth-redirect";

type FormState = { email: string; password: string };
type FieldErrors = { email?: string; password?: string };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

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
    if (touched.email && !emailOk) e.email = "Email tidak valid.";
    if (touched.password && !passOk) e.password = "Password minimal 8 karakter.";
    return e;
  }, [touched.email, touched.password, emailOk, passOk]);

  const inputBase =
    "h-11 w-full rounded-xl border bg-white/85 backdrop-blur px-4 text-sm " +
    "placeholder:text-[color:rgba(17,20,57,0.35)] " +
    "shadow-[inset_0_1px_0_rgba(17,20,57,0.04)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.28)] focus-visible:ring-offset-2";

  const btnBase =
    "inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.30)] focus-visible:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:opacity-60";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Mark touched so errors appear
    setTouched({ email: true, password: true });

    if (!emailOk) return setError("Email tidak valid.");
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
      return setError(j?.error || "Login failed.");
    }

    const next = getAuthRedirectFromQuery(new URLSearchParams(sp.toString()));
    router.replace(next || "/");
  }

  return (
    <div className="relative isolate min-h-dvh bg-[color:var(--bg)]">
      {/* PREMIUM FULL-PAGE BACKDROP */}
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
        {/* Left: brand (desktop) */}
        <div className="hidden md:block">
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
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:rgba(43,89,255,0.12)] text-[color:var(--fg)]">
                      ✓
                    </span>
                    Record daily visits and activity metrics.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:rgba(139,92,246,0.12)] text-[color:var(--fg)]">
                      ✓
                    </span>
                    Track daily and weekly leads summary.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:rgba(17,20,57,0.08)] text-[color:var(--fg)]">
                      ✓
                    </span>
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
            Tip: Use your company email for easier workspace recognition later.
          </div>
        </div>

        {/* Right: form */}
        <div className="w-full">
          <div className="mx-auto w-full max-w-md">
            <div className="relative rounded-3xl p-[1px] bg-[linear-gradient(135deg,rgba(43,89,255,0.38),rgba(139,92,246,0.26),rgba(17,20,57,0.10))] shadow-[0_35px_110px_rgba(17,20,57,0.18)]">
              <div className="relative overflow-hidden rounded-3xl bg-white/90 p-7 ring-1 ring-[rgba(17,20,57,0.07)] backdrop-blur">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.45) 35%, rgba(255,255,255,0.78) 100%)",
                  }}
                />
                <div className="relative">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-[color:var(--fg)]">
                      Login
                    </h2>
                    <p className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">
                      Enter your credentials to continue.
                    </p>
                  </div>

                  <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
                    <div className="space-y-2">
                      <label htmlFor={emailId} className="text-sm font-medium text-[color:var(--fg)]">
                        Email
                      </label>
                      <input
                        id={emailId}
                        name="email"
                        className={cx(
                          inputBase,
                          "border-[color:rgba(17,20,57,0.14)]",
                          fieldErrors.email && "border-[color:rgba(245,158,11,0.45)]"
                        )}
                        value={form.email}
                        onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        autoComplete="email"
                        inputMode="email"
                        placeholder="name@company.com"
                        aria-invalid={!!fieldErrors.email}
                        aria-describedby={fieldErrors.email ? `${emailId}-help` : undefined}
                      />
                      {fieldErrors.email ? (
                        <div id={`${emailId}-help`} className="text-xs text-amber-800">
                          {fieldErrors.email}
                        </div>
                      ) : (
                        <div className="text-xs text-[color:rgba(17,20,57,0.55)]">
                          Gunakan email perusahaan untuk akses workspace.
                        </div>
                      )}
                    </div>

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

                      <input
                        id={passId}
                        name="password"
                        className={cx(
                          inputBase,
                          "border-[color:rgba(17,20,57,0.14)]",
                          fieldErrors.password && "border-[color:rgba(245,158,11,0.45)]"
                        )}
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        aria-invalid={!!fieldErrors.password}
                        aria-describedby={fieldErrors.password ? `${passId}-help` : undefined}
                      />

                      <div className="flex items-center justify-between text-xs">
                        <span
                          id={`${passId}-help`}
                          className={cx(
                            "text-[color:rgba(17,20,57,0.58)]",
                            fieldErrors.password && "text-amber-800"
                          )}
                        >
                          {fieldErrors.password ? fieldErrors.password : "Password minimal 8 karakter."}
                        </span>
                        <span className="text-[color:rgba(17,20,57,0.58)]">{passOk ? "✓" : ""}</span>
                      </div>
                    </div>

                    {error ? (
                      <div
                        id={errorId}
                        role="alert"
                        aria-live="polite"
                        className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2"
                      >
                        <div className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-0.5 text-amber-800">
                            ⚠️
                          </span>
                          <p className="text-sm text-amber-900">{error}</p>
                        </div>
                      </div>
                    ) : null}

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
                      {loading ? "Signing in…" : "Sign in"}
                    </button>

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

          <div className="mt-6 md:hidden">
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
