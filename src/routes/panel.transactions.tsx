import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PanelShell } from "@/components/panel-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { fetchMyTransactions, type TxRecord } from "@/lib/monetization";

export const Route = createFileRoute("/panel/transactions")({
  component: TransactionsPage,
  head: () => ({
    meta: [
      { title: "Transaction History — XLM Browser" },
      { name: "description", content: "Every XLM payment you made on XLM Browser: badge purchases, project promotions and listing fees with transaction hashes." },
      { property: "og:title", content: "Transaction History — XLM Browser" },
      { property: "og:description", content: "Your XLM payment history on XLM Browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

export function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls = s === "success" || s === "active"
    ? "bg-success/20 text-success"
    : s === "pending"
    ? "bg-warning/20 text-warning"
    : "bg-destructive/20 text-destructive";
  return <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${cls}`}>{status}</span>;
}

export function TxHash({ hash }: { hash: string | null }) {
  if (!hash) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <a href={`https://livenet.stellar.org/transactions/${hash}`} target="_blank" rel="noreferrer"
      className="font-mono text-xs text-primary hover:underline" title={hash}>
      {hash.slice(0, 10)}…{hash.slice(-6)}
    </a>
  );
}

const KIND_LABEL: Record<string, string> = {
  badge: "Badge purchase",
  promotion: "Project promotion",
  listing: "Listing fee",
  escrow: "Escrow",
};

function TransactionsPage() {
  const { user } = useApp();
  const [rows, setRows] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setRows(await fetchMyTransactions(user.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load transactions");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const total = rows.filter((r) => r.status === "success").reduce((a, r) => a + r.amountXlm, 0);

  return (
    <PanelShell>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Transaction History</h1>
            <p className="text-sm text-muted-foreground">All on-chain payments made with your connected wallet.</p>
          </div>
          <button onClick={() => void load()} className="rounded border px-3 py-1.5 text-sm hover:bg-accent">Refresh</button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="soft-card p-5"><div className="text-xs uppercase tracking-wider text-muted-foreground">Payments</div><div className="mt-1 text-2xl font-bold">{rows.length}</div></div>
          <div className="soft-card p-5"><div className="text-xs uppercase tracking-wider text-muted-foreground">Total spent</div><div className="mt-1 text-2xl font-bold">{total} XLM</div></div>
          <div className="soft-card p-5"><div className="text-xs uppercase tracking-wider text-muted-foreground">Pending</div><div className="mt-1 text-2xl font-bold">{rows.filter((r) => r.status === "pending").length}</div></div>
        </div>

        {loading ? (
          <div className="soft-card mt-6 p-10 text-center text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="soft-card mt-6 p-10 text-center text-muted-foreground">No payments yet.</div>
        ) : (
          <div className="soft-card mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Description</th>
                  <th className="p-3">Amount</th><th className="p-3">Tx hash</th><th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="p-3 text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="p-3">{KIND_LABEL[r.kind] ?? r.kind}</td>
                    <td className="p-3">{r.description ?? "—"}</td>
                    <td className="p-3 font-medium">{r.amountXlm} XLM</td>
                    <td className="p-3"><TxHash hash={r.txHash} /></td>
                    <td className="p-3"><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PanelShell>
  );
}
