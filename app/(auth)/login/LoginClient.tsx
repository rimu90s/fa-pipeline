"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/app/_lib/supabase-browser";
import { isValidEmail, minLen } from "@/app/_lib/form-helpers";
import { getAuthRedirectFromQuery } from "@/app/_lib/auth-redirect";

type FormState = { email: string; password: string };

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = isValidEmail(form.email) && minLen(form.password, 8) && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(form.email)) return setError("Email tidak valid");
    if (!minLen(form.password, 8)) return setError("Password minimal 8 karakter");

    setLoading(true);
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    setLoading(false);

    if (signErr) return setError(signErr.message);

    const next = getAuthRedirectFromQuery(new URLSearchParams(sp.toString()));
    router.replace(next || "/visit");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-white p-6">
        <h1 className="text-xl font-semibold">Login</h1>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm">Email</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Password</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg border px-3 py-2 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="flex justify-between text-sm">
            <a className="underline" href="/forgot-password">
              Forgot password?
            </a>
            <a className="underline" href="/register">
              Create account
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
