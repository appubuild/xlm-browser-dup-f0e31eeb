import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PanelShell } from "@/components/panel-shell";
import { useApp, type Project } from "@/lib/app-store";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/panel/submissions")({ component: Submissions });

function Submissions() {
  const { user, projects, siteSettings, markProjectPaid } = useApp();
  const mine = projects.filter((p) => p.submitterId === user?.id);
  const [payFor, setPayFor] = useState<Project | null>(null);
  return (
    <PanelShell>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Submissions</h1>
          <Link to="/panel/submit" className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground">+ Submit new</Link>
        </div>
        {mine.length === 0 ? (
          <div className="soft-card mt-6 p-10 text-center text-muted-foreground">You haven't submitted any projects yet.</div>
        ) : (
          <div className="soft-card mt-6 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr><th className="p-3">Project</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Publish</th><th className="p-3">Date</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {mine.map((p) => {
                  const needsPay = p.status === "approved" && !p.isPublic && siteSettings.listingFeeXrp > 0;
                  return (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{p.logo} {p.name}</td>
                      <td className="p-3 capitalize">{p.category}</td>
                      <td className="p-3"><StatusBadge status={p.status} /></td>
                      <td className="p-3">
                        {p.isPublic ? <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">Live</span>
                          : p.status === "approved" ? (needsPay ? <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">Payment required</span> : <span className="text-xs text-muted-foreground">Publishing…</span>)
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3 text-muted-foreground">{p.dateAdded}</td>
                      <td className="p-3">
                        {needsPay && <button onClick={() => setPayFor(p)} className="rounded bg-primary px-2.5 py-1 text-xs text-primary-foreground">Pay {siteSettings.listingFeeXrp} XRP</button>}
                        {p.status === "rejected" && <Link to="/panel/submit" className="text-primary hover:underline">Edit &amp; Resubmit</Link>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PayDialog project={payFor} onClose={() => setPayFor(null)} onPaid={async (proj, tx) => {
        await markProjectPaid(proj.id, tx, siteSettings.listingFeeXrp);
        toast.success("Payment received — project is now live");
        setPayFor(null);
      }} />
    </PanelShell>
  );
}

function PayDialog({ project, onClose, onPaid }: { project: Project | null; onClose: () => void; onPaid: (p: Project, tx: string) => Promise<void> }) {
  const { siteSettings } = useApp();
  const pay = useServerFn(xamanPay);
  const status = useServerFn(xamanStatus);
  const [payload, setPayload] = useState<{ uuid: string; qrPng: string; deeplink: string; destination: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    if (!project) return;
    setError(null);
    setCreating(true);
    try {
      const res = await pay({ data: { amountXrp: siteSettings.listingFeeXrp, memo: `XRPBrowser listing: ${project.name}` } });
      setPayload({ uuid: res.uuid, qrPng: res.qrPng, deeplink: res.deeplink, destination: res.destination });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the payment request");
    } finally {
      setCreating(false);
    }
  };

  // Poll the payment payload until it is signed on-ledger.
  useEffect(() => {
    if (!payload || !project) return;
    let stop = false;
    const t = setInterval(() => {
      void (async () => {
        try {
          const s = await status({ data: { uuid: payload.uuid } });
          if (stop) return;
          if (s.signed && s.txid) { clearInterval(t); await onPaid(project, s.txid); return; }
          if (s.cancelled || (s.resolved && !s.signed)) { clearInterval(t); setError("Payment was rejected in Xaman."); setPayload(null); }
          else if (s.expired) { clearInterval(t); setError("The payment request expired."); setPayload(null); }
        } catch { /* transient */ }
      })();
    }, 2500);
    return () => { stop = true; clearInterval(t); };
  }, [payload, project, status, onPaid]);

  useEffect(() => { if (project) { setPayload(null); setError(null); } }, [project]);

  if (!project) return null;
  const addr = payload?.destination || siteSettings.listingPaymentAddress || "(admin has not set a payment address yet)";
  return (
    <Dialog open={!!project} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Pay listing fee — {project.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded border bg-muted/50 p-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><b>{siteSettings.listingFeeXrp} XRP</b></div>
            <div className="mt-1 flex justify-between gap-3"><span className="text-muted-foreground">To</span><span className="break-all font-mono text-xs">{addr}</span></div>
          </div>
          {error && <div className="whitespace-pre-wrap rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          {payload ? (
            <div className="grid gap-3 sm:grid-cols-[200px_1fr] sm:items-center">
              <div className="mx-auto grid h-[212px] w-[212px] place-items-center rounded-lg border bg-white p-2">
                <img src={payload.qrPng} alt="Xaman payment QR" className="h-[196px] w-[196px]" />
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Scan with Xaman and approve the payment. This page updates automatically.</div>
                <a href={payload.deeplink} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center rounded bg-primary px-3 py-2 text-sm text-primary-foreground">Open in Xaman</a>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">A Xaman payment request will be created — approve it in the app to publish your project.</div>
          )}
        </div>
        <DialogFooter>
          <button onClick={onClose} className="rounded border px-3 py-2 text-sm">Cancel</button>
          {!payload && (
            <button disabled={creating} onClick={() => void start()} className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
              {creating ? "Creating…" : `Pay ${siteSettings.listingFeeXrp} XRP with Xaman`}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { approved: "bg-success/20 text-success", pending: "bg-warning/20 text-warning", rejected: "bg-destructive/20 text-destructive" };
  return <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${map[status]}`}>{status}</span>;
}
