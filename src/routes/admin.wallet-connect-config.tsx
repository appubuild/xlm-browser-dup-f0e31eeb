import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { WALLETS } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/wallet-connect-config")({ component: WalletConfig });

function WalletConfig() {
  const { walletConfig, updateWalletConfig } = useApp();
  const toggle = (w: string) => {
    const enabled = walletConfig.enabled.includes(w) ? walletConfig.enabled.filter((x) => x !== w) : [...walletConfig.enabled, w];
    updateWalletConfig({ enabled });
  };
  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold">Wallet Connect Config</h1>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 text-sm font-medium">Enabled wallets</div>
          <ul className="space-y-2 text-sm">
            {WALLETS.map((w) => (
              <li key={w} className="flex items-center justify-between rounded border border-slate-800 p-2">
                <span>{w}</span>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={walletConfig.enabled.includes(w)} onChange={() => toggle(w)} /> Enabled</label>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 text-sm font-medium">Network</div>
          <label className="block text-xs">
            <div className="mb-1 text-slate-400">Network</div>
            <select value={walletConfig.network} onChange={(e) => updateWalletConfig({ network: e.target.value as never })} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              <option>Mainnet</option><option>Testnet</option>
            </select>
          </label>
          <label className="mt-3 block text-xs">
            <div className="mb-1 text-slate-400">XRPL RPC URL</div>
            <input value={walletConfig.rpcUrl} onChange={(e) => updateWalletConfig({ rpcUrl: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm" />
          </label>
        </div>
      </div>
      <button onClick={() => toast.success("Wallet config saved")} className="mt-4 rounded bg-sky-500 px-4 py-2 text-sm text-white">Save</button>
    </AdminShell>
  );
}
