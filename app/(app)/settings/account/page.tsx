// app/(app)/settings/account/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/app/_lib/supabase-browser";
import { minLen, postJson } from "@/app/_lib/form-helpers";

type DeleteReq = { password: string; confirm: string };
type DeleteRes = { ok: true };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirmOk = confirm === "DELETE";
  const canClickDelete = confirmOk && minLen(password, 8) && !loading;

  const inputBase =
    "h-11 w-full rounded-xl border bg-white/90 px-4 text-sm " +
    "shadow-[inset_0_1px_0_rgba(17,20,57,0.04)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.28)] focus-visible:ring-offset-2";

  async function doDelete() {
    setError(null);
    setInfo(null);
    setLoading(true);

    const result = await postJson<DeleteReq, DeleteRes>("/api/account/delete", {
      password,
      confirm,
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error.message);
      return;
    }

    await supabase.auth.signOut();
    setInfo("Account deleted");
    router.replace("/login");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
          Account Settings
        </h1>
        <p className="text-sm text-[color:rgba(17,20,57,0.62)]">
          Manage your account and security preferences.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-6 shadow-[0_18px_60px_rgba(17,20,57,0.08)]">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white">
            ⚠️
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[color:var(--fg)]">Delete account</h2>
            <p className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">
              Tindakan ini permanen. Anda harus mengetik <b>DELETE</b> dan memasukkan password untuk re-auth sebelum eksekusi.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--fg)]">Password (re-auth)</label>
            <input
              className={cx(inputBase, "border-[color:rgba(17,20,57,0.14)]")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <div className="text-xs text-[color:rgba(17,20,57,0.58)]">Minimal 8 karakter.</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--fg)]">Type DELETE to confirm</label>
            <input
              className={cx(inputBase, "border-[color:rgba(17,20,57,0.14)]")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
            />
            <div className="text-xs text-[color:rgba(17,20,57,0.58)]">
              {confirmOk ? "✅ Konfirmasi benar." : "Harus persis: DELETE"}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2">
            <div className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 text-amber-800">⚠️</span>
              <p className="text-sm text-amber-900">{error}</p>
            </div>
          </div>
        ) : null}

        {info ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2">
            <div className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-0.5 text-emerald-800">✅</span>
              <p className="text-sm text-emerald-900">{info}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!canClickDelete}
            onClick={() => setOpenModal(true)}
          >
            Delete my account
          </button>

          <button
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[color:rgba(17,20,57,0.14)] bg-white px-4 text-sm font-semibold hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.30)] focus-visible:ring-offset-2"
            disabled={loading}
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
      </div>

      {openModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-[0_30px_120px_rgba(17,20,57,0.28)]">
            <h3 className="text-base font-semibold text-[color:var(--fg)]">Confirm deletion</h3>
            <p className="mt-2 text-sm text-[color:rgba(17,20,57,0.62)]">
              Ini permanen dan tidak dapat dibatalkan. Lanjutkan?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[color:rgba(17,20,57,0.14)] bg-white px-4 text-sm font-semibold hover:bg-zinc-50 disabled:opacity-60"
                disabled={loading}
                onClick={() => setOpenModal(false)}
              >
                Cancel
              </button>

              <button
                className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!canClickDelete}
                onClick={async () => {
                  setOpenModal(false);
                  await doDelete();
                }}
              >
                {loading ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
