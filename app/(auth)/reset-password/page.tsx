"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/app/_lib/supabase-browser";
import { minLen } from "@/app/_lib/form-helpers";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function passError(p: string) {
  if (!p) return "Password baru wajib diisi.";
  if (!minLen(p, 8)) return "Password minimal 8 karakter.";
  return null;
}
function confirmError(p: string, c: string) {
  if (!c) return "Konfirmasi password wajib diisi.";
  if (c !== p) return "Konfirmasi password tidak sama.";
  return null;
}

function humanize(raw: string) {
  const msg = (raw || "").toLowerCase();
  if (msg.includes("expired") || msg.includes("invalid")) return "Link reset tidak valid atau sudah kedaluwarsa. Minta link baru.";
  if (msg.includes("rate limit") || msg.includes("too many")) return "Terlalu banyak percobaan. Coba lagi nanti.";
  if (msg.includes("network") || msg.includes("fetch")) return "Koneksi bermasalah. Coba cek internet Anda.";
  return raw || "Reset password gagal. Coba lagi.";
}

function errMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function isCapsLockOn(e: React.KeyboardEvent<HTMLInputElement>) {
  return e.getModifierState?.("CapsLock") ?? false;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ p: false, c: false });
  const [showP, setShowP] = useState(false);
  const [showC, setShowC] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const pErr = touched.p ? passError(password) : null;
  const cErr = touched.c ? confirmError(password, confirm) : null;

  const canSubmit = !passError(password) && !confirmError(password, confirm) && !loading && !booting;

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const code = sp.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
      } catch (e: unknown) {
        if (alive) setErr(humanize(errMessage(e)));
      } finally {
        if (alive) setBooting(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [sp, supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || booting) return;

    setErr(null);
    setOk(null);
    setTouched({ p: true, c: true });

    const pe = passError(password);
    const ce = confirmError(password, confirm);
    if (pe || ce) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setErr(humanize(error.message));
      return;
    }

    setOk("Password berhasil diperbarui. Silakan login kembali.");
    window.setTimeout(() => router.replace("/login"), 900);
  }

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

  return (
    <div className="relative isolate min-h-dvh bg-[color:var(--bg)]">
      {/* BACKDROP */}
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
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(248,248,249,0.42) 0%, rgba(248,248,249,0.52) 55%, rgba(248,248,249,0.66) 100%)" }} />
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
        <div className="absolute inset-0" style={{ background: "radial-gradient(1200px 700px at 50% 40%, rgba(255,255,255,0) 0%, rgba(248,248,249,0.22) 55%, rgba(17,20,57,0.14) 100%)" }} />
      </div>

      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-10 md:grid-cols-2">
        <div className="hidden md:block animate-[authIn_.55s_ease-out_both]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(17,20,57,0.14)] bg-white/60 px-3 py-1 text-xs font-semibold backdrop-blur">
            <span className="h-2 w-2 rounded-full" style={{ background: "linear-gradient(135deg, var(--grad-2), var(--grad-3))" }} />
            FA Pipeline
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[color:var(--fg)]">Set new password</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:rgba(17,20,57,0.66)]">
            Buat password baru yang aman. Setelah berhasil, Anda akan diarahkan ke login.
          </p>
        </div>

        <div className="w-full">
          <div className="mx-auto w-full max-w-md animate-[authIn_.55s_ease-out_both] [animation-delay:60ms]">
            <div className="relative rounded-3xl p-[1px] bg-[linear-gradient(135deg,rgba(43,89,255,0.38),rgba(139,92,246,0.26),rgba(17,20,57,0.10))] shadow-[0_35px_110px_rgba(17,20,57,0.18)]">
              <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-md p-7 ring-1 ring-[rgba(17,20,57,0.08)]">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.60) 35%, rgba(255,255,255,0.86) 100%)" }} />
                <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[520px] -translate-x-1/2 rounded-full opacity-[0.55] blur-2xl" style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} />

                <div className="relative">
                  <h2 className="text-xl font-semibold tracking-tight text-[color:var(--fg)]">Reset password</h2>
                  <p className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">
                    Choose a new password to secure your account.
                  </p>

                  <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
                    {booting ? (
                      <div className="rounded-xl border border-[rgba(17,20,57,0.10)] bg-white/70 px-3 py-3 text-sm text-[color:rgba(17,20,57,0.70)]">
                        Memverifikasi link reset…
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--fg)]" htmlFor="rp-pass">
                        New password
                      </label>
                      <div className="relative">
                        <input
                          id="rp-pass"
                          className={cx(
                            inputBase,
                            "pr-12",
                            pErr ? "border-red-300 focus-visible:ring-[rgba(239,68,68,0.28)]" : "border-[color:rgba(17,20,57,0.14)]"
                          )}
                          type={showP ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setErr(null);
                            setOk(null);
                            setPassword(e.target.value);
                          }}
                          onBlur={() => setTouched((t) => ({ ...t, p: true }))}
                          onKeyUp={(e) => setCapsOn(isCapsLockOn(e))}
                          autoComplete="new-password"
                          placeholder="Minimal 8 karakter"
                          aria-invalid={!!pErr}
                          aria-describedby="rp-pass-help"
                        />
                        <button
                          type="button"
                          onClick={() => setShowP((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[color:rgba(17,20,57,0.65)] hover:bg-[rgba(17,20,57,0.06)]"
                        >
                          {showP ? "Hide" : "Show"}
                        </button>
                      </div>

                      <p
                        id="rp-pass-help"
                        className={cx("text-xs", pErr ? "text-red-600" : "text-[color:rgba(17,20,57,0.58)]")}
                      >
                        {pErr ? pErr : "Gunakan kombinasi yang aman."}
                      </p>

                      {capsOn ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-900">
                          Caps Lock aktif.
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[color:var(--fg)]" htmlFor="rp-confirm">
                        Confirm password
                      </label>
                      <div className="relative">
                        <input
                          id="rp-confirm"
                          className={cx(
                            inputBase,
                            "pr-12",
                            cErr ? "border-red-300 focus-visible:ring-[rgba(239,68,68,0.28)]" : "border-[color:rgba(17,20,57,0.14)]"
                          )}
                          type={showC ? "text" : "password"}
                          value={confirm}
                          onChange={(e) => {
                            setErr(null);
                            setOk(null);
                            setConfirm(e.target.value);
                          }}
                          onBlur={() => setTouched((t) => ({ ...t, c: true }))}
                          autoComplete="new-password"
                          placeholder="Ulangi password"
                          aria-invalid={!!cErr}
                          aria-describedby="rp-confirm-help"
                        />
                        <button
                          type="button"
                          onClick={() => setShowC((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-[color:rgba(17,20,57,0.65)] hover:bg-[rgba(17,20,57,0.06)]"
                        >
                          {showC ? "Hide" : "Show"}
                        </button>
                      </div>

                      <p
                        id="rp-confirm-help"
                        className={cx("text-xs", cErr ? "text-red-600" : "text-[color:rgba(17,20,57,0.58)]")}
                      >
                        {cErr ? cErr : "Pastikan sama dengan password."}
                      </p>
                    </div>

                    {err ? (
                      <div role="alert" aria-live="polite" className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2">
                        <div className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-0.5 text-amber-800">⚠️</span>
                          <p className="text-sm text-amber-900">{err}</p>
                        </div>
                        <div className="mt-2 text-xs text-amber-900/80">
                          Jika link sudah kedaluwarsa, minta{" "}
                          <Link href="/forgot-password" className="underline underline-offset-4">
                            link baru
                          </Link>
                          .
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
                      <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "radial-gradient(500px 120px at 50% -10%, rgba(255,255,255,0.45), rgba(255,255,255,0) 70%)" }} />
                      {loading ? (
                        <span className="relative inline-flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white/90" />
                          Updating…
                        </span>
                      ) : (
                        <span className="relative">Update password</span>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:rgba(17,20,57,0.62)]">Back to</span>
                      <Link
                        href="/login"
                        className="text-[color:var(--fg)] underline decoration-[rgba(17,20,57,0.25)] underline-offset-4 hover:opacity-90 hover:decoration-[rgba(17,20,57,0.45)]"
                      >
                        Login
                      </Link>
                    </div>

                    <div className="pt-1 text-xs text-[color:rgba(17,20,57,0.58)]">
                      This page is only accessible via a secure reset link.
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 md:hidden animate-[authIn_.55s_ease-out_both] [animation-delay:90ms]">
            <div className="rounded-2xl border border-[color:rgba(17,20,57,0.14)] bg-white/65 p-5 backdrop-blur">
              <div className="text-sm font-semibold text-[color:var(--fg)]">FA Pipeline</div>
              <p className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">Create a new password securely.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
