// app/(app)/settings/page.tsx
export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--fg)]">
          Settings
        </h1>
        <p className="text-sm text-[color:rgba(17,20,57,0.62)]">
          Manage your account and security preferences.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-[0_18px_60px_rgba(17,20,57,0.08)]">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white">
              👤
            </span>
            <div className="min-w-0">
              <div className="text-base font-semibold text-[color:var(--fg)]">Account</div>
              <div className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">
                Change password, review security, and manage account actions.
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <a
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[color:rgba(17,20,57,0.14)] bg-white px-4 text-sm font-semibold hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(43,89,255,0.30)] focus-visible:ring-offset-2"
              href="/settings/account"
            >
              Account settings
            </a>

            <a
              className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
              href="/settings/account/delete"
            >
              Delete account
            </a>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-[0_18px_60px_rgba(17,20,57,0.08)]">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white">
              🛡️
            </span>
            <div className="min-w-0">
              <div className="text-base font-semibold text-[color:var(--fg)]">Security</div>
              <div className="mt-1 text-sm text-[color:rgba(17,20,57,0.62)]">
                Your session is protected with cookie-based auth and RBAC.
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border bg-white/70 p-4 text-sm text-[color:rgba(17,20,57,0.70)]">
            Tip: Jika akses export/visit dibatasi, pastikan role Anda sudah sesuai (FA / Branch Manager / Company Admin / Auditor).
          </div>
        </div>
      </div>
    </div>
  );
}
