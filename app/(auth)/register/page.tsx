"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/app/_lib/supabase-browser";
import { isValidEmail, minLen } from "@/app/_lib/form-helpers";

type FormState = {
  full_name: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    minLen(form.full_name, 2) &&
    isValidEmail(form.email) &&
    minLen(form.password, 8) &&
    !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isValidEmail(form.email)) return setError("Email tidak valid");
    if (!minLen(form.password, 8)) return setError("Password minimal 8 karakter");
    if (!minLen(form.full_name, 2)) return setError("Full name wajib diisi");

    setLoading(true);
    const { data, error: signErr } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.full_name.trim() },
      },
    });
    setLoading(false);

    if (signErr) return setError(signErr.message);

    // jika email confirmation aktif, user biasanya belum punya session
    if (!data.session) {
      setMessage("Registrasi berhasil. Silakan cek email untuk verifikasi.");
      return;
    }

    router.replace("/visit");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-lg p-6">
        <h1 className="text-xl font-semibold">Register</h1>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm">Full name</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.full_name}
              onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
              autoComplete="name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Email</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Password</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              autoComplete="new-password"
            />
            <div className="text-xs opacity-70">Minimal 8 karakter.</div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {message && <div className="text-sm text-green-700">{message}</div>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full border rounded px-3 py-2 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          <div className="text-sm">
            Sudah punya akun?{" "}
            <a className="underline" href="/login">
              Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
