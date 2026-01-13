"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/app/_lib/supabase-browser";
import { minLen } from "@/app/_lib/form-helpers";

type FormState = { password: string; password2: string };

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [form, setForm] = useState<FormState>({ password: "", password2: "" });
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    minLen(form.password, 8) && form.password === form.password2 && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!minLen(form.password, 8)) return setError("Password minimal 8 karakter");
    if (form.password !== form.password2) return setError("Konfirmasi password tidak sama");

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: form.password });
    setLoading(false);

    if (err) return setError(err.message);

    setInfo("Password berhasil diperbarui. Silakan login kembali.");
    setTimeout(() => router.replace("/login"), 500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-lg p-6">
        <h1 className="text-xl font-semibold">Reset password</h1>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm">New password</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Confirm new password</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              value={form.password2}
              onChange={(e) => setForm((s) => ({ ...s, password2: e.target.value }))}
              autoComplete="new-password"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {info && <div className="text-sm text-green-700">{info}</div>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full border rounded px-3 py-2 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update password"}
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
