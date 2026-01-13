export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account.</p>
      </div>

      <div className="rounded-xl border bg-white p-5 space-y-3">
        <div className="text-sm">
          <div className="font-medium">Account</div>
          <div className="text-muted-foreground">Change password, delete account, and more.</div>
        </div>

        {/* arahkan ke flow delete account yang sudah ada dari PROMPT 14.1 */}
        <a className="inline-block rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50" href="/settings/account">
          Account settings
        </a>

        <a className="inline-block rounded-lg border px-3 py-2 text-sm hover:bg-zinc-50" href="/settings/account/delete">
          Delete account
        </a>
      </div>
    </div>
  );
}
