import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useApp, type Category } from "@/lib/app-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
  head: () => ({
    meta: [
      { title: "Categories — XRPBrowser Admin" },
      { name: "description", content: "Create, edit, reorder and delete XRPL project categories." },
      { property: "og:title", content: "Categories — XRPBrowser Admin" },
      { property: "og:description", content: "Manage XRPL project categories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Draft = { id?: string; name: string; slug: string; icon: string; description: string; visible: boolean };

const empty: Draft = { name: "", slug: "", icon: "📁", description: "", visible: true };

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Category | null>(null);

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[i], b = sorted[j];
    try {
      await Promise.all([
        updateCategory(a.id, { sortOrder: b.sortOrder }),
        updateCategory(b.id, { sortOrder: a.sortOrder }),
      ]);
      toast.success("Order updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reorder");
    }
  };

  const save = async () => {
    if (!draft) return;
    const name = draft.name.trim();
    const slug = (draft.slug.trim() || slugify(name));
    if (!name) return toast.error("Category name is required");
    if (!slug) return toast.error("Slug is required");
    const clash = categories.some((c) => c.slug === slug && c.id !== draft.id);
    if (clash) return toast.error(`The slug "${slug}" is already used by another category`);
    setBusy(true);
    try {
      if (draft.id) {
        await updateCategory(draft.id, { name, slug, icon: draft.icon, description: draft.description, visible: draft.visible });
        toast.success(`"${name}" updated`);
      } else {
        await addCategory({ name, slug, icon: draft.icon || "📁", description: draft.description, visible: draft.visible, sortOrder: categories.length + 1 });
        toast.success(`"${name}" created`);
      }
      setDraft(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirmDel) return;
    setBusy(true);
    try {
      await deleteCategory(confirmDel.id);
      toast.success(`"${confirmDel.name}" deleted`);
      setConfirmDel(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleVisible = async (c: Category, visible: boolean) => {
    try {
      await updateCategory(c.id, { visible });
      toast.success(visible ? `"${c.name}" is now visible` : `"${c.name}" hidden`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm opacity-70">Live from the database — every change saves instantly.</p>
        </div>
        <button onClick={() => setDraft({ ...empty })} className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground">+ Add category</button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-current/10">
        <table className="w-full text-sm">
          <thead className="text-left text-xs opacity-70">
            <tr>
              <th className="p-2">Order</th><th className="p-2">Icon</th><th className="p-2">Name</th>
              <th className="p-2">Slug</th><th className="p-2">Description</th><th className="p-2">Visible</th><th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={c.id} className="border-t border-current/10">
                <td className="p-2 whitespace-nowrap">
                  <button onClick={() => void move(i, -1)} className="mr-1 rounded border border-current/20 px-1">↑</button>
                  <button onClick={() => void move(i, 1)} className="rounded border border-current/20 px-1">↓</button>
                </td>
                <td className="p-2 text-2xl">{c.icon}</td>
                <td className="p-2 font-medium">{c.name}</td>
                <td className="p-2 text-xs opacity-70">{c.slug}</td>
                <td className="p-2 opacity-70">{c.description}</td>
                <td className="p-2">
                  <input type="checkbox" checked={c.visible} onChange={(e) => void toggleVisible(c, e.target.checked)} />
                </td>
                <td className="p-2 text-xs whitespace-nowrap">
                  <button onClick={() => setDraft({ id: c.id, name: c.name, slug: c.slug, icon: c.icon, description: c.description ?? "", visible: c.visible })} className="text-sky-500 hover:underline">Edit</button>
                  {" · "}
                  <button onClick={() => setConfirmDel(c)} className="text-rose-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center opacity-60">No categories yet — add your first one.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft?.id ? "Edit category" : "New category"}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-3">
              <label className="block text-sm">
                <div className="mb-1 text-xs opacity-70">Name *</div>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} className="inp" placeholder="DeFi" />
              </label>
              <label className="block text-sm">
                <div className="mb-1 text-xs opacity-70">Slug *</div>
                <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} className="inp" placeholder="defi" />
              </label>
              <label className="block text-sm">
                <div className="mb-1 text-xs opacity-70">Icon (emoji)</div>
                <input value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} className="inp" placeholder="💠" />
              </label>
              <label className="block text-sm">
                <div className="mb-1 text-xs opacity-70">Description</div>
                <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="inp min-h-20" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.visible} onChange={(e) => setDraft({ ...draft, visible: e.target.checked })} />
                Visible on the public site
              </label>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setDraft(null)} className="rounded border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => void save()} disabled={busy} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
              {busy ? "Saving…" : draft?.id ? "Save changes" : "Create category"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete category</DialogTitle></DialogHeader>
          <p className="text-sm opacity-80">
            Delete <b>{confirmDel?.name}</b>? Projects already in this category keep their tag, but the category disappears from the directory.
          </p>
          <DialogFooter>
            <button onClick={() => setConfirmDel(null)} className="rounded border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => void remove()} disabled={busy} className="rounded bg-rose-600 px-4 py-2 text-sm text-white disabled:opacity-50">
              {busy ? "Deleting…" : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
