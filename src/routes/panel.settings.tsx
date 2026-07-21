import { createFileRoute } from "@tanstack/react-router";
import { PanelShell } from "@/components/panel-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/panel/settings")({ component: Settings });

function Settings() {
  const { user, theme, toggleTheme } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <PanelShell>
      <div className="max-w-2xl p-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        <section className="soft-card mt-6 space-y-3 p-5">
          <div className="font-semibold">Profile</div>
          <label className="block text-sm"><div className="mb-1 text-xs">Display name</div><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" /></label>
          <label className="block text-sm"><div className="mb-1 text-xs">Email</div><input readOnly value={user?.email ?? ""} className="w-full rounded border bg-muted px-3 py-2 text-sm" /></label>
          <label className="block text-sm"><div className="mb-1 text-xs">Avatar (mock upload)</div><input type="file" className="text-sm" /></label>
          <button onClick={() => toast.success("Profile saved")} className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground">Save</button>
        </section>

        <section className="soft-card mt-4 space-y-3 p-5">
          <div className="font-semibold">Theme</div>
          <p className="text-sm text-muted-foreground">Currently: <b>{theme === "light" ? "Modern Web3" : "Retro Terminal"}</b></p>
          <button onClick={toggleTheme} className="rounded border px-3 py-2 text-sm hover:bg-accent">Toggle theme</button>
        </section>

        <section className="soft-card mt-4 space-y-2 p-5 text-sm">
          <div className="font-semibold">Notifications</div>
          {["Project approvals", "Weekly digest", "News alerts"].map((l) => (
            <label key={l} className="flex items-center gap-2"><input type="checkbox" defaultChecked /> {l}</label>
          ))}
        </section>

        <section className="soft-card mt-4 space-y-2 p-5 text-sm">
          <div className="font-semibold">Connected Wallet</div>
          <div className="font-mono text-muted-foreground">{user?.walletAddress ?? "No wallet connected"}</div>
        </section>

        <section className="soft-card mt-4 space-y-2 p-5 text-sm">
          <div className="font-semibold text-destructive">Danger Zone</div>
          <button onClick={() => setConfirmDel(true)} className="rounded border border-destructive px-3 py-2 text-sm text-destructive hover:bg-destructive/10">Delete account</button>
          {confirmDel && (
            <div className="rounded border border-destructive/40 bg-destructive/5 p-3 text-sm">
              Are you sure? This is a mock action.
              <div className="mt-2 flex gap-2">
                <button onClick={() => { setConfirmDel(false); toast("Account deletion simulated"); }} className="rounded bg-destructive px-3 py-1.5 text-xs text-destructive-foreground">Confirm</button>
                <button onClick={() => setConfirmDel(false)} className="rounded border px-3 py-1.5 text-xs">Cancel</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
}
