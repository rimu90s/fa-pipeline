"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/app/_lib/supabase-browser";
import { isValidEmail } from "@/app/_lib/form-helpers";

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!isValidEmail(email)) return setError("Email tidak valid");

    const origin = window.location.origin;
    const redirectTo = `${origin}/reset-password`;

    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setLoading(false);

    if (err) return setError(err.message);

    setInfo("Jika email terdaftar, link reset password telah dikirim.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-lg p-6">
        <h1 className="text-xl font-semibold">Forgot password</h1>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm">Email</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {info && <div className="text-sm text-green-700">{info}</div>}

          <button
            type="submit"
            disabled={!isValidEmail(email) || loading}
            className="w-full border rounded px-3 py-2 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>

          <div className="text-sm">
            <a className="underline" href="/login">
              Back to login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
