import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/wallet-connect-config")({ component: WalletConfig });

function WalletConfig() {
  const { walletConfig, updateWalletConfig, siteSettings, updateSiteSettings } = useApp();
  const [saving, setSaving] = useState(false);

  // Load the saved settings (admins only, enforced by RLS).
  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("wallet_config" as never).select("*").eq("id", 1).maybeSingle();
      if (!data) return;
      const r = data as Record<string, string>;
      updateWalletConfig({
        treasuryAddress: r.treasury_address ?? "",
        network: (r.network as "Mainnet" | "Testnet") ?? "Mainnet",
        rpcUrl: r.rpc_url ?? "https://horizon.stellar.org",
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("wallet_config" as never).upsert({
        id: 1,
        treasury_address: walletConfig.treasuryAddress.trim(),
        network: walletConfig.network,
        rpc_url: walletConfig.rpcUrl,
        updated_at: new Date().toISOString(),
      } as never);
      if (error) throw error;
      if (siteSettings.listingPaymentAddress !== walletConfig.treasuryAddress) {
        await updateSiteSettings({ listingPaymentAddress: walletConfig.treasuryAddress });
      }
      toast.success("Wallet configuration saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save wallet configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold">Wallet Connect Config</h1>
        <p className="mt-1 text-sm text-slate-400">
          XLM Browser uses <b>Freighter</b> as the wallet for user connect &amp; payments. Visitors sign
          transactions in the Freighter browser extension — no API keys are required. Listing fees are sent to
          the treasury address below.
        </p>

        <div className="mt-6 space-y-4">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-emerald-500/20 text-emerald-300">🏦</span>
              <div>
                <div className="text-sm font-semibold">Treasury address</div>
                <div className="text-xs text-slate-400">Stellar account that receives listing-fee payments.</div>
              </div>
            </div>
            <label className="mt-3 block text-xs">
              <div className="mb-1 text-slate-400">Stellar address (G...)</div>
              <input
                value={walletConfig.treasuryAddress}
                onChange={(e) => updateWalletConfig({ treasuryAddress: e.target.value })}
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
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
                <div className="text-xs text-slate-400">Which Stellar network payments and balances use.</div>
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
                <div className="mb-1 text-slate-400">Horizon URL</div>
                <input
                  value={walletConfig.rpcUrl}
                  onChange={(e) => updateWalletConfig({ rpcUrl: e.target.value })}
                  placeholder="https://horizon.stellar.org"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={save} disabled={saving} className="rounded bg-sky-500 px-4 py-2 text-sm text-white hover:bg-sky-400 disabled:opacity-50">{saving ? "Saving…" : "Save configuration"}</button>
        </div>
      </div>
    </AdminShell>
  );
}
