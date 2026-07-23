import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp, type LandingSection } from "@/lib/app-store";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/landing")({ component: AdminLandingPage });

const PROJECT_PICK_KEYS = new Set(["featured", "trending", "popular"]);

function AdminLandingPage() {
  const { landingSections, updateLandingSection } = useApp();
  return (
    <AdminShell>
      <div>
        <h1 className="text-xl font-bold">Landing Page Sections</h1>
        <p className="mt-1 text-sm text-slate-400">Edit each section — title, subtitle, visibility, ordering, and (for project sections) which projects appear.</p>
        <div className="mt-6 space-y-3">
          {[...landingSections].sort((a, b) => a.sortOrder - b.sortOrder).map((s) => (
            <SectionEditor key={s.id} section={s} onSave={(patch) => updateLandingSection(s.id, patch)} />
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

function SectionEditor({ section, onSave }: { section: LandingSection; onSave: (p: Partial<LandingSection>) => Promise<void> }) {
  const { projects } = useApp();
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle);
  const [visible, setVisible] = useState(section.visible);
  const [order, setOrder] = useState(section.sortOrder);
  const initialSlugs = ((section.config?.projectSlugs as string[] | undefined) ?? []);
  const [slugs, setSlugs] = useState<string[]>(initialSlugs);
  const [saving, setSaving] = useState(false);
  const supportsPicker = PROJECT_PICK_KEYS.has(section.sectionKey);
  const approved = projects.filter((p) => p.status === "approved");

  const toggleSlug = (slug: string) =>
    setSlugs((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));

  const save = async () => {
    setSaving(true);
    const config = supportsPicker ? { ...section.config, projectSlugs: slugs } : section.config;
    await onSave({ title, subtitle, visible, sortOrder: order, config });
    setSaving(false);
    toast.success(`Saved "${section.sectionKey}"`);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center gap-3">
        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs uppercase tracking-wider text-slate-400">{section.sectionKey}</span>
        <label className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /> Visible
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Order
          <input type="number" value={order} onChange={(e) => setOrder(+e.target.value || 0)} className="w-16 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm" />
        </label>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle" className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
      </div>

      {supportsPicker && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Projects in this section ({slugs.length} selected · leave empty for auto)</span>
            {slugs.length > 0 && (
              <button onClick={() => setSlugs([])} className="text-slate-300 hover:text-white">Clear</button>
            )}
          </div>
          <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto rounded border border-slate-800 bg-slate-950 p-2 sm:grid-cols-2 md:grid-cols-3">
            {approved.map((p) => {
              const checked = slugs.includes(p.slug);
              return (
                <label key={p.id} className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm ${checked ? "bg-sky-500/20 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleSlug(p.slug)} />
                  <span>{p.logo}</span>
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto text-[10px] uppercase text-slate-500">{p.category}</span>
                </label>
              );
            })}
            {approved.length === 0 && <div className="col-span-full p-4 text-center text-xs text-slate-500">No approved projects yet.</div>}
          </div>
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <button onClick={save} disabled={saving} className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}
