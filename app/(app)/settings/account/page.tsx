"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/app/_lib/supabase-browser";
import { minLen, postJson } from "@/app/_lib/form-helpers";

type DeleteReq = { password: string; confirm: string };
type DeleteRes = { ok: true };

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
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Account Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and security preferences.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="text-base font-semibold">Delete account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tindakan ini permanen. Anda harus mengetik <b>DELETE</b> dan memasukkan
          password untuk re-auth sebelum eksekusi.
        </p>

        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Password (re-auth)</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <div className="text-xs text-muted-foreground">Minimal 8 karakter.</div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Type DELETE to confirm</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {info && <div className="text-sm text-green-700">{info}</div>}

          <button
            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            disabled={!canClickDelete}
            onClick={() => setOpenModal(true)}
          >
            Delete my account
          </button>
        </div>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-xl border bg-white p-5 shadow">
            <h3 className="text-base font-semibold">Confirm deletion</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ini permanen dan tidak dapat dibatalkan. Lanjutkan?
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50"
                disabled={loading}
                onClick={() => setOpenModal(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
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
      )}
    </div>
  );
}
