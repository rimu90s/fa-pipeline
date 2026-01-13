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

    // success: sign out client + redirect
    await supabase.auth.signOut();
    setInfo("Account deleted");
    router.replace("/login");
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold">Account Settings</h1>

      <div className="mt-6 border rounded-lg p-5">
        <h2 className="font-semibold">Delete account</h2>
        <p className="text-sm opacity-80 mt-1">
          Tindakan ini permanen. Anda harus mengetik <b>DELETE</b> dan memasukkan
          password untuk re-auth sebelum eksekusi.
        </p>

        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm">Password (re-auth)</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <div className="text-xs opacity-70">Minimal 8 karakter.</div>
          </div>

          <div className="space-y-1">
            <label className="text-sm">Type DELETE to confirm</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {info && <div className="text-sm text-green-700">{info}</div>}

          <button
            className="border rounded px-3 py-2 disabled:opacity-50"
            disabled={!canClickDelete}
            onClick={() => setOpenModal(true)}
          >
            Delete my account
          </button>
        </div>
      </div>

      {/* Modal double-confirm */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-lg p-5">
            <h3 className="font-semibold">Confirm deletion</h3>
            <p className="text-sm opacity-80 mt-2">
              Ini permanen dan tidak dapat dibatalkan. Lanjutkan?
            </p>

            <div className="mt-4 flex gap-2 justify-end">
              <button
                className="border rounded px-3 py-2"
                disabled={loading}
                onClick={() => setOpenModal(false)}
              >
                Cancel
              </button>
              <button
                className="border rounded px-3 py-2 disabled:opacity-50"
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
