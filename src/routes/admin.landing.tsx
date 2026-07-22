import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp, type LandingSection } from "@/lib/app-store";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/landing")({ component: AdminLandingPage });

function AdminLandingPage() {
  const { landingSections, updateLandingSection } = useApp();
  return (
    <AdminShell>
      <div>
        <h1 className="text-xl font-bold">Landing Page Sections</h1>
        <p className="mt-1 text-sm text-slate-400">Edit each section of the home page — title, subtitle, visibility, ordering.</p>
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
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle);
  const [visible, setVisible] = useState(section.visible);
  const [order, setOrder] = useState(section.sortOrder);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave({ title, subtitle, visible, sortOrder: order });
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
      <div className="mt-3 flex justify-end">
        <button onClick={save} disabled={saving} className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}
