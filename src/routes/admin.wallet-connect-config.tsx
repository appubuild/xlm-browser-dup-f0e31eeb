import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/wallet-connect-config")({ component: WalletConfig });

function WalletConfig() {
  const { walletConfig, updateWalletConfig, siteSettings, updateSiteSettings } = useApp();
  const [showSecret, setShowSecret] = useState(false);

  const save = async () => {
    if (siteSettings.listingPaymentAddress !== walletConfig.treasuryAddress) {
      await updateSiteSettings({ listingPaymentAddress: walletConfig.treasuryAddress });
    }
    toast.success("Wallet configuration saved");
  };

  return (
    <AdminShell>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold">Wallet Connect Config</h1>
        <p className="mt-1 text-sm text-slate-400">
          XRPBrowser uses <b>Xaman (Xumm)</b> as the exclusive wallet for user connect &amp; payments.
          Users connect via QR or the Xaman mobile app and pay listing fees to the treasury address below.
        </p>

        <div className="mt-6 space-y-4">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-indigo-500/20 text-indigo-300">🪙</span>
              <div>
                <div className="text-sm font-semibold">Xaman API credentials</div>
                <div className="text-xs text-slate-400">
                  Get them from <a className="text-sky-400 hover:underline" href="https://apps.xaman.dev" target="_blank" rel="noreferrer">apps.xaman.dev</a> → your app → API keys.
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="block text-xs">
                <div className="mb-1 text-slate-400">API Key</div>
                <input
                  value={walletConfig.xamanApiKey}
                  onChange={(e) => updateWalletConfig({ xamanApiKey: e.target.value })}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="block text-xs">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-slate-400">API Secret</span>
                  <button type="button" onClick={() => setShowSecret((s) => !s)} className="text-slate-400 hover:text-slate-200">
                    {showSecret ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showSecret ? "text" : "password"}
                  value={walletConfig.xamanApiSecret}
                  onChange={(e) => updateWalletConfig({ xamanApiSecret: e.target.value })}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
                />
                <div className="mt-1 text-[11px] text-slate-500">Kept locally in this prototype. In production, store as a server-side secret.</div>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-emerald-500/20 text-emerald-300">🏦</span>
              <div>
                <div className="text-sm font-semibold">Treasury address</div>
                <div className="text-xs text-slate-400">XRPL address that receives listing-fee payments.</div>
              </div>
            </div>
            <label className="mt-3 block text-xs">
              <div className="mb-1 text-slate-400">XRPL address (r...)</div>
              <input
                value={walletConfig.treasuryAddress}
                onChange={(e) => updateWalletConfig({ treasuryAddress: e.target.value })}
                placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
              />
            </label>
            <div className="mt-2 text-[11px] text-slate-500">
              This will be saved to <b>Site Settings → Listing payment address</b> so paid submissions send here.
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-sky-500/20 text-sky-300">🌐</span>
              <div>
                <div className="text-sm font-semibold">Network</div>
                <div className="text-xs text-slate-400">Which XRPL network Xaman payloads target.</div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-xs">
                <div className="mb-1 text-slate-400">Network</div>
                <select
                  value={walletConfig.network}
                  onChange={(e) => updateWalletConfig({ network: e.target.value as never })}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                >
                  <option>Mainnet</option>
                  <option>Testnet</option>
                </select>
              </label>
              <label className="block text-xs">
                <div className="mb-1 text-slate-400">XRPL RPC URL</div>
                <input
                  value={walletConfig.rpcUrl}
                  onChange={(e) => updateWalletConfig({ rpcUrl: e.target.value })}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={save} className="rounded bg-sky-500 px-4 py-2 text-sm text-white hover:bg-sky-400">Save configuration</button>
        </div>
      </div>
    </AdminShell>
  );
}
