import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp, type Project, type ProjectStatus, type LiveStatusVal } from "@/lib/app-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RichEditor } from "@/components/rich-editor";
import { PROJECT_BADGES, ProjectBadges } from "@/components/project-badges";

const inp = "w-full rounded border bg-background px-2.5 py-1.5 text-sm";

const PLATFORMS = ["website", "x", "discord", "telegram", "github", "linkedin", "youtube", "medium", "reddit", "instagram", "facebook", "tiktok"];

type Draft = {
  name: string; tagline: string; category: string; url: string; logo: string;
  description: string; aiDoc: string; supportEmail: string; liveStatus: LiveStatusVal;
  screenshots: string[]; socials: Record<string, string>;
  status: ProjectStatus; isPublic: boolean; verified: boolean; featured: boolean; badges: string[];
};

const toDraft = (p: Project): Draft => ({
  name: p.name, tagline: p.tagline, category: p.category, url: p.url, logo: p.logo,
  description: p.description, aiDoc: p.aiDoc ?? "", supportEmail: p.supportEmail ?? "",
  liveStatus: p.liveStatus, screenshots: p.screenshots ?? [], socials: { ...(p.socials ?? {}) },
  status: p.status, isPublic: p.isPublic, verified: p.verified, featured: p.featured,
  badges: p.badges ?? [],
});

/** Edit dialog used by project owners (/panel) and admins (/admin). */
export function ProjectFormDialog({
  project, mode, onClose, onSaved,
}: { project: Project | null; mode: "author" | "admin"; onClose: () => void; onSaved?: () => void }) {
  const { updateProject, categories } = useApp();
  const [d, setD] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const isAdmin = mode === "admin";

  useEffect(() => { setD(project ? toDraft(project) : null); }, [project]);

  if (!project || !d) return null;
  const patch = (x: Partial<Draft>) => setD((s) => (s ? { ...s, ...x } : s));

  const save = async () => {
    if (!d.name.trim()) return toast.error("Project name is required");
    if (!d.url.trim()) return toast.error("Project URL is required");
    setSaving(true);
    try {
      const base: Partial<Project> = {
        name: d.name.trim(), tagline: d.tagline, category: d.category, url: d.url.trim(),
        logo: d.logo, description: d.description, aiDoc: d.aiDoc, supportEmail: d.supportEmail,
        liveStatus: d.liveStatus, screenshots: d.screenshots.filter(Boolean), socials: d.socials,
      };
      await updateProject(project.id, isAdmin
        ? { ...base, status: d.status, isPublic: d.isPublic, verified: d.verified, featured: d.featured, badges: d.badges }
        : base);
      toast.success("Project updated");
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  const cats = categories.length > 0
    ? categories.map((c) => ({ value: c.slug, label: c.name }))
    : [{ value: d.category, label: d.category }];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>Edit {project.name}</DialogTitle></DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Project name *"><input value={d.name} onChange={(e) => patch({ name: e.target.value })} className={inp} /></Field>
            <Field label="Category">
              <select value={d.category} onChange={(e) => patch({ category: e.target.value })} className={inp}>
                {cats.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Website URL *"><input value={d.url} onChange={(e) => patch({ url: e.target.value })} className={inp} /></Field>
            <Field label="Logo (emoji or image URL)"><input value={d.logo} onChange={(e) => patch({ logo: e.target.value })} className={inp} /></Field>
            <Field label="Support email"><input value={d.supportEmail} onChange={(e) => patch({ supportEmail: e.target.value })} className={inp} /></Field>
            <Field label="Live status">
              <select value={d.liveStatus} onChange={(e) => patch({ liveStatus: e.target.value as LiveStatusVal })} className={inp}>
                {["Live", "Beta", "Coming Soon"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Tagline"><input value={d.tagline} onChange={(e) => patch({ tagline: e.target.value })} className={inp} /></Field>

          <Field label="Full description">
            <RichEditor value={d.description} onChange={(v) => patch({ description: v })} placeholder="Describe your project…" />
          </Field>
          <Field label="AI documentation (used by the project AI assistant)">
            <RichEditor value={d.aiDoc} onChange={(v) => patch({ aiDoc: v })} placeholder="Docs, FAQs, tokenomics…" minHeight={120} />
          </Field>

          <Field label="Screenshots (one URL per line)">
            <textarea value={d.screenshots.join("\n")} onChange={(e) => patch({ screenshots: e.target.value.split("\n") })} className={`${inp} min-h-20`} />
          </Field>

          <div>
            <div className="mb-1 text-xs text-muted-foreground">Social links</div>
            <div className="space-y-2">
              {Object.entries(d.socials).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <select
                    value={k}
                    onChange={(e) => {
                      const next: Record<string, string> = {};
                      Object.entries(d.socials).forEach(([kk, vv]) => { next[kk === k ? e.target.value : kk] = vv; });
                      patch({ socials: next });
                    }}
                    className={`${inp} w-40`}
                  >
                    {[...new Set([...PLATFORMS, k])].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input value={v} onChange={(e) => patch({ socials: { ...d.socials, [k]: e.target.value } })} className={inp} placeholder="https://…" />
                  <button
                    onClick={() => { const next = { ...d.socials }; delete next[k]; patch({ socials: next }); }}
                    className="rounded border px-2 text-sm hover:bg-accent"
                  >✕</button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const free = PLATFORMS.find((p) => !(p in d.socials)) ?? `link${Object.keys(d.socials).length + 1}`;
                patch({ socials: { ...d.socials, [free]: "" } });
              }}
              className="mt-2 rounded border px-3 py-1.5 text-xs hover:bg-accent"
            >+ Add social link</button>
          </div>

          {isAdmin && (
            <div className="rounded-lg border p-3">
              <div className="mb-2 text-sm font-semibold">Admin controls</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Approval status">
                  <select value={d.status} onChange={(e) => patch({ status: e.target.value as ProjectStatus })} className={inp}>
                    {["pending", "approved", "rejected"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <div className="flex flex-wrap items-end gap-3 text-sm">
                  <label className="flex items-center gap-1"><input type="checkbox" checked={d.isPublic} onChange={(e) => patch({ isPublic: e.target.checked })} /> Published</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={d.verified} onChange={(e) => patch({ verified: e.target.checked })} /> Verified</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={d.featured} onChange={(e) => patch({ featured: e.target.checked })} /> Featured</label>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 text-xs text-muted-foreground">Custom badges</div>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_BADGES.map((b) => {
                    const on = d.badges.includes(b.key);
                    return (
                      <button
                        key={b.key}
                        onClick={() => patch({ badges: on ? d.badges.filter((x) => x !== b.key) : [...d.badges, b.key] })}
                        className={`rounded-full border px-2.5 py-1 text-xs ${on ? b.cls : "opacity-60 hover:opacity-100"}`}
                      >{b.icon} {b.label}</button>
                    );
                  })}
                </div>
                <div className="mt-2"><ProjectBadges badges={d.badges} /></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <button onClick={onClose} className="rounded border px-4 py-2 text-sm hover:bg-accent">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Read-only submission metadata + moderation status for the author. */
export function ProjectDetailsDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  if (!project) return null;
  const rows: [string, string][] = [
    ["Slug", project.slug],
    ["Category", project.category],
    ["URL", project.url],
    ["Live status", project.liveStatus],
    ["Support email", project.supportEmail || "—"],
    ["Approval status", project.status === "pending" ? "Pending review" : project.status === "approved" ? "Approved" : "Rejected"],
    ["Visibility", project.isPublic ? "Published" : "Unlisted / draft"],
    ["Submitted", project.dateAdded],
    ["Visits", String(project.visits)],
    ["Payment tx", project.paymentTx ?? "—"],
  ];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader><DialogTitle>{project.logo} {project.name}</DialogTitle></DialogHeader>
        <ProjectBadges badges={project.badges} />
        <dl className="divide-y text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-3 py-1.5">
              <dt className="w-36 shrink-0 text-muted-foreground">{k}</dt>
              <dd className="break-all">{v}</dd>
            </div>
          ))}
        </dl>
        {project.tagline && <p className="text-sm"><b>Tagline:</b> {project.tagline}</p>}
        {project.description && (
          <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: project.description }} />
        )}
        <DialogFooter>
          <button onClick={onClose} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Close</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm"><div className="mb-1 text-xs text-muted-foreground">{label}</div>{children}</label>;
}
