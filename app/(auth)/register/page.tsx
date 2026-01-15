"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/app/_lib/supabase-browser";
import { isValidEmail, minLen } from "@/app/_lib/form-helpers";

type FormState = { email: string; password: string; confirm: string };
type TouchedState = { email: boolean; password: boolean; confirm: boolean };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function emailError(email: string) {
  if (!email.trim()) return "Email wajib diisi.";
  if (!isValidEmail(email)) return "Format email tidak valid.";
  return null;
}
function passwordError(password: string) {
  if (!password) return "Password wajib diisi.";
  if (!minLen(password, 8)) return "Password minimal 8 karakter.";
  return null;
}
function confirmError(password: string, confirm: string) {
  if (!confirm) return "Konfirmasi password wajib diisi.";
  if (confirm !== password) return "Konfirmasi password tidak sama.";
  return null;
}

function humanizeAuthError(raw: string) {
  const msg = (raw || "").toLowerCase();
  if (msg.includes("already registered")) return "Email sudah terdaftar. Silakan login.";
  if (msg.includes("email") && msg.includes("invalid")) return "Format email tidak valid.";
  if (msg.includes("password")) return "Password tidak memenuhi ketentuan.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Terlalu banyak percobaan. Coba lagi beberapa saat.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Koneksi bermasalah. Coba cek internet Anda.";
  return raw || "Pendaftaran gagal. Coba lagi.";
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

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [form, setForm] = useState<FormState>({ email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState<TouchedState>({
    email: false,
    password: false,
    confirm: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    if (!isCoarse) window.setTimeout(() => emailRef.current?.focus(), 120);
  }, []);

  // Auto-clean success after a bit (still redirects)
  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4500);
    return () => window.clearTimeout(t);
  }, [success]);

  const eErr = touched.email ? emailError(form.email) : null;
  const pErr = touched.password ? passwordError(form.password) : null;
  const cErr = touched.confirm ? confirmError(form.password, form.confirm) : null;

  const okEmail = !emailError(form.email);
  const okPass = !passwordError(form.password);
  const okConfirm = !confirmError(form.password, form.confirm);

  const canSubmit = okEmail && okPass && okConfirm && !loading && !success;

  const disabledReason = loading
    ? "Sedang memproses…"
    : success
      ? "Akun dibuat. Mengarahkan ke login…"
      : !form.email.trim() || !form.password || !form.confirm
        ? "Lengkapi semua field."
        : !okEmail
          ? "Periksa format email."
          : !okPass
            ? "Password minimal 8 karakter."
            : !okConfirm
              ? "Konfirmasi password harus sama."
              : null;

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
    if (loading || success) return;

    setFormError(null);
    setSuccess(null);
    setTouched({ email: true, password: true, confirm: true });

    const ee = emailError(form.email);
    const pe = passwordError(form.password);
    const ce = confirmError(form.password, form.confirm);
    if (ee || pe || ce) return;

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    });

    setLoading(false);

    if (error) {
      setFormError(humanizeAuthError(error.message));
      return;
    }

    setSuccess("Akun berhasil dibuat. Silakan cek email untuk verifikasi, lalu login.");
    window.setTimeout(() => router.replace("/login"), 1400);
  }

  return (
    <div className="relative isolate min-h-dvh bg-[color:var(--bg)]">
      {/* BACKDROP (same as login) */}
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
        {/* Left */}
        <div className="hidden md:block animate-[authIn_.55s_ease-out_both]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(17,20,57,0.14)] bg-white/60 px-3 py-1 text-xs font-semibold backdrop-blur">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "linear-gradient(135deg, var(--grad-2), var(--grad-3))" }}
            />
            FA Pipeline
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[color:var(--fg)]">
            Create account
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:rgba(17,20,57,0.66)]">
            Create your account to access{" "}
            <span className="font-semibold text-[color:var(--fg)]">Visits</span>,{" "}
            <span className="font-semibold text-[color:var(--fg)]">Leads</span>, and{" "}
            <span className="font-semibold text-[color:var(--fg)]">Exports</span>.
          </p>

          <div className="mt-8 overflow-hidden rounded-3xl border border-[color:rgba(17,20,57,0.14)] bg-white/60 backdrop-blur">
            <div className="relative px-6 py-6">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1"
                style={{
                  background:
                    "linear-gradient(90deg, var(--grad-2), var(--grad-3), var(--grad-2))",
                }}
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[color:var(--fg)]">Why sign up</div>
                  <span className="rounded-full border border-[color:rgba(17,20,57,0.14)] bg-white/80 px-2 py-0.5 text-[11px] font-medium text-[color:rgba(17,20,57,0.70)]">
                    Secure by design
                  </span>
                </div>

                <ul className="mt-4 space-y-3 text-sm text-[color:rgba(17,20,57,0.66)]">
                  <li className="flex items-start gap-3">
                    <IconCheck tone="blue" /> Audit-ready reporting.
                  </li>
                  <li className="flex items-start gap-3">
                    <IconCheck tone="purple" /> Role-based access control.
                  </li>
                  <li className="flex items-start gap-3">
                    <IconCheck tone="navy" /> Export CSV / Excel anytime.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-[color:rgba(17,20,57,0.58)]">
            Tip: gunakan email perusahaan untuk verifikasi yang lebih cepat.
          </div>
        </div>

        {/* Right */}
        <div className="w-full">
          <div className="mx-auto w-full max-w-md animate-[authIn_.55s_ease-out_both] [animation-delay:60ms]">
            <div className="relative rounded-3xl p-[1px] bg-[linear-gradient(135deg,rgba(43,89,255,0.38),rgba(139,92,246,0.26),rgba(17,20,57,0.10))] shadow-[0_35px_110px_rgba(17,20,57,0.18)] transition-transform duration-300 will-change-transform hover:-translate-y-1">
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
                    Register
                  </h2>
                  <p className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">
                    Create your account to continue.
                  </p>

                  <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--fg)]" htmlFor="reg-email">
                        Email
                      </label>
                      <input
                        ref={emailRef}
                        id="reg-email"
                        className={cx(
                          inputBase,
                          eErr
                            ? "border-red-300 focus-visible:ring-[rgba(239,68,68,0.28)]"
                            : "border-[color:rgba(17,20,57,0.14)]"
                        )}
                        value={form.email}
                        onChange={(e) => {
                          setFormError(null);
                          setSuccess(null);
                          setForm((s) => ({ ...s, email: e.target.value }));
                        }}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        autoComplete="email"
                        inputMode="email"
                        placeholder="name@company.com"
                        aria-invalid={!!eErr}
                        aria-describedby="reg-email-help"
                      />
                      <p
                        id="reg-email-help"
                        className={cx("text-xs", eErr ? "text-red-600" : "text-[color:rgba(17,20,57,0.58)]")}
                      >
                        {eErr ? eErr : "Gunakan email perusahaan untuk verifikasi."}
                      </p>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--fg)]" htmlFor="reg-pass">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="reg-pass"
                          className={cx(
                            inputBase,
                            "pr-12",
                            pErr
                              ? "border-red-300 focus-visible:ring-[rgba(239,68,68,0.28)]"
                              : "border-[color:rgba(17,20,57,0.14)]"
                          )}
                          type={showPass ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => {
                            setFormError(null);
                            setSuccess(null);
                            setForm((s) => ({ ...s, password: e.target.value }));
                          }}
                          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                          onKeyUp={(e) => setCapsOn(isCapsLockOn(e))}
                          autoComplete="new-password"
                          placeholder="Minimal 8 karakter"
                          aria-invalid={!!pErr}
                          aria-describedby="reg-pass-help"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[color:rgba(17,20,57,0.65)] hover:bg-[rgba(17,20,57,0.06)]"
                        >
                          {showPass ? "Hide" : "Show"}
                        </button>
                      </div>

                      <p
                        id="reg-pass-help"
                        className={cx("text-xs", pErr ? "text-red-600" : "text-[color:rgba(17,20,57,0.58)]")}
                      >
                        {pErr ? pErr : "Gunakan kombinasi yang mudah diingat, tapi aman."}
                      </p>

                      {capsOn ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-900">
                          Caps Lock aktif.
                        </div>
                      ) : null}
                    </div>

                    {/* Confirm */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--fg)]" htmlFor="reg-confirm">
                        Confirm password
                      </label>
                      <div className="relative">
                        <input
                          id="reg-confirm"
                          className={cx(
                            inputBase,
                            "pr-12",
                            cErr
                              ? "border-red-300 focus-visible:ring-[rgba(239,68,68,0.28)]"
                              : "border-[color:rgba(17,20,57,0.14)]"
                          )}
                          type={showConfirm ? "text" : "password"}
                          value={form.confirm}
                          onChange={(e) => {
                            setFormError(null);
                            setSuccess(null);
                            setForm((s) => ({ ...s, confirm: e.target.value }));
                          }}
                          onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                          autoComplete="new-password"
                          placeholder="Ulangi password"
                          aria-invalid={!!cErr}
                          aria-describedby="reg-confirm-help"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[color:rgba(17,20,57,0.65)] hover:bg-[rgba(17,20,57,0.06)]"
                        >
                          {showConfirm ? "Hide" : "Show"}
                        </button>
                      </div>

                      <p
                        id="reg-confirm-help"
                        className={cx("text-xs", cErr ? "text-red-600" : "text-[color:rgba(17,20,57,0.58)]")}
                      >
                        {cErr ? cErr : "Pastikan sama dengan password."}
                      </p>
                    </div>

                    {formError ? (
                      <div role="alert" aria-live="polite" className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2">
                        <div className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-0.5 text-amber-800">⚠️</span>
                          <p className="text-sm text-amber-900">{formError}</p>
                        </div>
                      </div>
                    ) : null}

                    {success ? (
                      <div role="status" aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2">
                        <div className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-0.5 text-emerald-800">✅</span>
                          <p className="text-sm text-emerald-900">{success}</p>
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
                          Creating…
                        </span>
                      ) : (
                        <span className="relative">Create account</span>
                      )}
                    </button>

                    {disabledReason ? (
                      <div className="text-xs text-[color:rgba(17,20,57,0.58)]">{disabledReason}</div>
                    ) : null}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:rgba(17,20,57,0.62)]">Already have an account?</span>
                      <Link
                        href="/login"
                        className="text-[color:var(--fg)] underline decoration-[rgba(17,20,57,0.25)] underline-offset-4 hover:opacity-90 hover:decoration-[rgba(17,20,57,0.45)]"
                      >
                        Login
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
          <div className="mt-6 md:hidden animate-[authIn_.55s_ease-out_both] [animation-delay:90ms]">
            <div className="rounded-2xl border border-[color:rgba(17,20,57,0.14)] bg-white/65 p-5 backdrop-blur">
              <div className="text-sm font-semibold text-[color:var(--fg)]">FA Pipeline</div>
              <p className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">Create an account to access reports.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
