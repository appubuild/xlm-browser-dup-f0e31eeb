import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  WALLET_OPTIONS, DEFAULT_WALLETS, connectWallet, disconnectWallet, getStellarBalance, HORIZON,
} from "@/lib/stellar-wallet";

export const Route = createFileRoute("/admin/wallet-connect-config")({ component: WalletConfig });

/** Guard against legacy XRPL endpoints saved before the Stellar migration. */
function safeHorizon(url: unknown, network: "Mainnet" | "Testnet") {
  const u = typeof url === "string" ? url.trim() : "";
  if (!/^https?:\/\//i.test(u) || /xrpl|ripple|xrplcluster/i.test(u)) return HORIZON[network];
  return u;
}

function WalletConfig() {
  const { walletConfig, updateWalletConfig, siteSettings, updateSiteSettings } = useApp();
  const [saving, setSaving] = useState(false);
  const [wallets, setWallets] = useState<string[]>(DEFAULT_WALLETS);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Load the saved settings (admins only, enforced by RLS).
  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("wallet_config" as never).select("*").eq("id", 1).maybeSingle();
      if (!data) return;
      const r = data as Record<string, unknown>;
      const network = ((r.network as "Mainnet" | "Testnet") ?? "Mainnet");
      updateWalletConfig({
        treasuryAddress: (r.treasury_address as string) ?? "",
        network,
        rpcUrl: safeHorizon(r.rpc_url, network),
      });
      if (Array.isArray(r.enabled_wallets) && r.enabled_wallets.length) setWallets(r.enabled_wallets as string[]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const toggle = (id: string) =>
    setWallets((s) => (s.includes(id) ? s.filter((w) => w !== id) : [...s, id]));

  const save = async () => {
    if (!wallets.length) { toast.error("Enable at least one wallet"); return; }
    setSaving(true);
    try {
      const horizon = safeHorizon(walletConfig.rpcUrl, walletConfig.network);
      const { error } = await supabase.from("wallet_config" as never).upsert({
        id: 1,
        treasury_address: walletConfig.treasuryAddress.trim(),
        network: walletConfig.network,
        rpc_url: horizon,
        enabled_wallets: wallets,
        updated_at: new Date().toISOString(),
      } as never);
      if (error) throw error;
      if (horizon !== walletConfig.rpcUrl) updateWalletConfig({ rpcUrl: horizon });
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

  const testConnect = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { address, via } = await connectWallet({
        network: walletConfig.network,
        horizonUrl: walletConfig.rpcUrl,
        treasuryAddress: walletConfig.treasuryAddress,
        enabledWallets: wallets,
        walletConnectProjectId: "",
      });
      const bal = await getStellarBalance(address, walletConfig.network).catch(() => null);
      setTestResult(
        `Connected via ${via === "kit" ? "Stellar Wallets Kit" : "Freighter fallback"} — ${address}` +
          (bal ? ` · ${bal.funded ? `${bal.balance} XLM` : "account not funded"}` : ""),
      );
      toast.success("Wallet connection works");
    } catch (e) {
      setTestResult(e instanceof Error ? e.message : "Connection test failed");
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold">Wallet Connect Config</h1>
        <p className="mt-1 text-sm text-slate-400">
          XLM Browser uses the <b>Stellar Wallets Kit</b> for connect &amp; payments — Freighter, xBull, Albedo,
          Rabet, Lobstr and Hana are supported, and the app falls back to Freighter automatically if the kit
          cannot load. No API keys are required. Listing fees are sent to the treasury address below.
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
              <span className="grid h-8 w-8 place-items-center rounded-md bg-violet-500/20 text-violet-300">👛</span>
              <div>
                <div className="text-sm font-semibold">Supported wallets</div>
                <div className="text-xs text-slate-400">Which wallets appear in the connect modal.</div>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {WALLET_OPTIONS.map((w) => (
                <label key={w.id} className="flex items-center gap-2 rounded border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
                  <input type="checkbox" checked={wallets.includes(w.id)} onChange={() => toggle(w.id)} />
                  {w.label}
                </label>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Freighter should stay enabled — it is also the automatic fallback.
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
                  onChange={(e) => {
                    const network = e.target.value as "Mainnet" | "Testnet";
                    updateWalletConfig({ network, rpcUrl: HORIZON[network] });
                  }}
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
                  placeholder={HORIZON[walletConfig.network]}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => updateWalletConfig({ rpcUrl: HORIZON[walletConfig.network] })}
                  className="mt-1 text-[11px] text-sky-400 hover:underline"
                >
                  Reset to default Stellar Horizon
                </button>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-amber-500/20 text-amber-300">💳</span>
              <div>
                <div className="text-sm font-semibold">Listing fee (XLM payment)</div>
                <div className="text-xs text-slate-400">Charged when a project is submitted for listing.</div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-xs">
                <div className="mb-1 text-slate-400">Listing fee in XLM (set 0 for free)</div>
                <input
                  type="number" min={0} step="0.1"
                  value={siteSettings.listingFeeXlm}
                  onChange={(e) => void updateSiteSettings({ listingFeeXlm: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs">
                <div className="mb-1 text-slate-400">Receiving Stellar address</div>
                <input
                  readOnly
                  value={siteSettings.listingPaymentAddress || walletConfig.treasuryAddress}
                  placeholder="Set the treasury address above"
                  className="w-full rounded border border-slate-800 bg-slate-950/60 px-3 py-2 font-mono text-sm text-slate-400"
                />
              </label>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Payments always go to the treasury address above. When the fee is 0, approved projects publish automatically.
            </div>
          </section>


          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm font-semibold">Test connection</div>
            <div className="mt-1 text-xs text-slate-400">
              Opens the wallet chooser and reads the account balance. Nothing is signed or sent.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => void testConnect()} disabled={testing}
                className="rounded border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50">
                {testing ? "Waiting for wallet…" : "Run connection test"}
              </button>
              <button onClick={() => { void disconnectWallet(); setTestResult(null); toast("Wallet session cleared"); }}
                className="rounded border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">
                Clear wallet session
              </button>
            </div>
            {testResult && (
              <div className="mt-3 break-all rounded border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">{testResult}</div>
            )}
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={save} disabled={saving} className="rounded bg-sky-500 px-4 py-2 text-sm text-white hover:bg-sky-400 disabled:opacity-50">{saving ? "Saving…" : "Save configuration"}</button>
        </div>
      </div>
    </AdminShell>
  );
}
