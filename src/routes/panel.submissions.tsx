import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PanelShell } from "@/components/panel-shell";
import { useApp, type Project } from "@/lib/app-store";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StellarPayDialog } from "@/components/stellar-pay-dialog";
import { ProjectFormDialog, ProjectDetailsDialog } from "@/components/project-form-dialog";
import { ProjectBadges } from "@/components/project-badges";
import { fetchPromotionPackages, createPromotion, SLOT_LABEL, type PromotionPackage, type PromoSlot } from "@/lib/monetization";


export const Route = createFileRoute("/panel/submissions")({ component: Submissions });

function Submissions() {
  const { user, projects, siteSettings, markProjectPaid, updateProject, deleteProject } = useApp();
  const mine = projects.filter((p) => p.submitterId === user?.id);
  const [payFor, setPayFor] = useState<Project | null>(null);
  const [promoteFor, setPromoteFor] = useState<Project | null>(null);
  const [editFor, setEditFor] = useState<Project | null>(null);
  const [detailsFor, setDetailsFor] = useState<Project | null>(null);
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
                  const needsPay = p.status === "approved" && !p.isPublic && siteSettings.listingFeeXlm > 0;
                  return (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">
                        <div>{p.logo} {p.name}</div>
                        <ProjectBadges badges={p.badges} size="xs" className="mt-1" />
                      </td>
                      <td className="p-3 capitalize">{p.category}</td>
                      <td className="p-3"><StatusBadge status={p.status} /></td>
                      <td className="p-3">
                        {p.status === "approved" && (p.isPublic || !needsPay) ? (
                          <button
                            onClick={async () => { await updateProject(p.id, { isPublic: !p.isPublic }); toast.success(p.isPublic ? "Project unpublished" : "Project published"); }}
                            className={`rounded-full px-2 py-0.5 text-xs ${p.isPublic ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}
                            title="Toggle published / draft"
                          >
                            {p.isPublic ? "Published" : "Draft (unlisted)"}
                          </button>
                        ) : p.isPublic ? <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">Live</span>
                          : p.status === "approved" ? (needsPay ? <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">Payment required</span> : <span className="text-xs text-muted-foreground">Publishing…</span>)
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3 text-muted-foreground">{p.dateAdded}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {needsPay && <button onClick={() => setPayFor(p)} className="rounded bg-primary px-2.5 py-1 text-xs text-primary-foreground">Pay {siteSettings.listingFeeXlm} XLM</button>}
                          {p.isPublic && <button onClick={() => setPromoteFor(p)} className="rounded border px-2.5 py-1 text-xs hover:bg-accent">🚀 Promote</button>}
                          <button onClick={() => setEditFor(p)} className="rounded border px-2.5 py-1 text-xs hover:bg-accent">Edit</button>
                          <button onClick={() => setDetailsFor(p)} className="rounded border px-2.5 py-1 text-xs hover:bg-accent">Details</button>
                          <button
                            onClick={async () => { if (!confirm(`Delete ${p.name}? This cannot be undone.`)) return; await deleteProject(p.id); toast("Project deleted"); }}
                            className="rounded border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                          >Delete</button>
                        </div>
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
        await markProjectPaid(proj.id, tx, siteSettings.listingFeeXlm);
        toast.success("Payment received — project is now live");
        setPayFor(null);
      }} />

      <PromoteDialog project={promoteFor} onClose={() => setPromoteFor(null)} />
      <ProjectFormDialog project={editFor} mode="author" onClose={() => setEditFor(null)} />
      <ProjectDetailsDialog project={detailsFor} onClose={() => setDetailsFor(null)} />
    </PanelShell>
  );
}

function PromoteDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const { user } = useApp();
  const [pkgs, setPkgs] = useState<PromotionPackage[]>([]);
  const [picked, setPicked] = useState<PromotionPackage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!project) { setPicked(null); return; }
    setLoading(true);
    void fetchPromotionPackages()
      .then(setPkgs)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load packages"))
      .finally(() => setLoading(false));
  }, [project]);

  if (!project) return null;
  const bySlot = (Object.keys(SLOT_LABEL) as PromoSlot[]).map((slot) => ({ slot, items: pkgs.filter((p) => p.slot === slot) }));

  return (
    <>
      <Dialog open={!!project && !picked} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Promote {project.name}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Pick a section and duration. After payment the placement waits for admin verification, then goes live.</p>
          {loading ? <div className="py-6 text-center text-sm text-muted-foreground">Loading packages…</div> : (
            <div className="space-y-4">
              {bySlot.map(({ slot, items }) => items.length > 0 && (
                <div key={slot}>
                  <div className="mb-2 text-sm font-semibold">{SLOT_LABEL[slot]}</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((p) => (
                      <button key={p.id} onClick={() => setPicked(p)}
                        className="flex items-center justify-between rounded-lg border p-3 text-left text-sm hover:border-primary hover:bg-accent">
                        <span>{p.durationDays} days</span>
                        <b>{p.priceXlm} XLM</b>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {pkgs.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No promotion packages are available right now.</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <XamanPayDialog
        open={!!picked}
        title={`Promote ${project.name}`}
        subtitle={picked ? `${SLOT_LABEL[picked.slot]} · ${picked.durationDays} days` : undefined}
        amountXlm={picked?.priceXlm ?? 0}
        memo={`XLM Browser promotion ${project.slug}`}
        onClose={() => setPicked(null)}
        onPaid={async (txHash, account) => {
          if (!user || !picked) return;
          try {
            await createPromotion({
              userId: user.id, projectSlug: project.slug, projectName: project.name,
              pkg: picked, txHash, account, autoVerify: true,
            });
            toast.success("Payment confirmed — your promotion is live");
            setPicked(null);
            onClose();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not record the promotion");
          }
        }}
      />
    </>
  );
}

function PayDialog({ project, onClose, onPaid }: { project: Project | null; onClose: () => void; onPaid: (p: Project, tx: string) => Promise<void> }) {
  const { siteSettings } = useApp();
  if (!project) return null;
  return (
    <StellarPayDialog
      open={!!project}
      title={`Pay listing fee — ${project.name}`}
      subtitle="Approve the transaction in Freighter to publish your project."
      amountXlm={siteSettings.listingFeeXlm}
      memo={`Listing ${project.slug}`.slice(0, 28)}
      onClose={onClose}
      onPaid={async (txHash) => { await onPaid(project, txHash); }}
    />
  );
}



function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { approved: "bg-success/20 text-success", pending: "bg-warning/20 text-warning", rejected: "bg-destructive/20 text-destructive" };
  return <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${map[status]}`}>{status}</span>;
}
