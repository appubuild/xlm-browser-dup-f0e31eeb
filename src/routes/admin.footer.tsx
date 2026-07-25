import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/admin/footer")({ component: AdminFooter });

function AdminFooter() {
  const {
    footerGroups, footerLinks,
    addFooterGroup, updateFooterGroup, deleteFooterGroup,
    addFooterLink, updateFooterLink, deleteFooterLink,
  } = useApp();

  const groups = [...footerGroups].sort((a, b) => a.sortOrder - b.sortOrder);

  const move = (list: { id: string; sortOrder: number }[], id: string, dir: -1 | 1, updater: (id: string, patch: { sortOrder: number }) => Promise<void>) => {
    const sorted = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
    const i = sorted.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    void updater(sorted[i].id, { sortOrder: sorted[j].sortOrder });
    void updater(sorted[j].id, { sortOrder: sorted[i].sortOrder });
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Footer</h1>
          <div className="text-xs text-muted-foreground">Manage link groups displayed in the public site footer.</div>
        </div>
        <button
          onClick={() => {
            const label = prompt("Group label (e.g. Company, Legal)");
            if (!label) return;
            void addFooterGroup(label).then(() => toast("Group added"));
          }}
          className="inline-flex items-center gap-1 rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-400"
        >
          <Plus className="h-4 w-4" /> Add group
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {groups.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No footer groups yet. Click “Add group” to create your first.
          </div>
        )}
        {groups.map((g) => {
          const links = footerLinks.filter((l) => l.groupId === g.id).sort((a, b) => a.sortOrder - b.sortOrder);
          return (
            <div key={g.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  defaultValue={g.label}
                  onBlur={(e) => e.target.value !== g.label && void updateFooterGroup(g.id, { label: e.target.value })}
                  className="rounded border bg-background px-2 py-1 text-sm font-semibold"
                />
                <label className="ml-2 flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={g.visible} onChange={(e) => void updateFooterGroup(g.id, { visible: e.target.checked })} /> Visible
                </label>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => move(groups, g.id, -1, updateFooterGroup)} className="rounded border p-1 hover:bg-accent"><ArrowUp className="h-3 w-3" /></button>
                  <button onClick={() => move(groups, g.id, 1, updateFooterGroup)} className="rounded border p-1 hover:bg-accent"><ArrowDown className="h-3 w-3" /></button>
                  <button
                    onClick={() => { if (confirm("Delete this group and all its links?")) { void deleteFooterGroup(g.id).then(() => toast("Deleted")); } }}
                    className="rounded border p-1 text-rose-500 hover:bg-accent"
                  ><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>

              <table className="mt-3 w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr><th className="p-1 text-left">Label</th><th className="p-1 text-left">Link</th><th className="p-1">External</th><th className="p-1">Visible</th><th className="p-1">Order</th><th className="p-1"></th></tr>
                </thead>
                <tbody>
                  {links.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="p-1"><input defaultValue={l.label} onBlur={(e) => e.target.value !== l.label && void updateFooterLink(l.id, { label: e.target.value })} className="w-full rounded border bg-background px-2 py-1" /></td>
                      <td className="p-1"><input defaultValue={l.href} onBlur={(e) => e.target.value !== l.href && void updateFooterLink(l.id, { href: e.target.value })} className="w-full rounded border bg-background px-2 py-1 font-mono text-xs" /></td>
                      <td className="p-1 text-center"><input type="checkbox" checked={l.external} onChange={(e) => void updateFooterLink(l.id, { external: e.target.checked })} /></td>
                      <td className="p-1 text-center"><input type="checkbox" checked={l.visible} onChange={(e) => void updateFooterLink(l.id, { visible: e.target.checked })} /></td>
                      <td className="p-1 text-center">
                        <div className="inline-flex gap-1">
                          <button onClick={() => move(links, l.id, -1, updateFooterLink)} className="rounded border p-1 hover:bg-accent"><ArrowUp className="h-3 w-3" /></button>
                          <button onClick={() => move(links, l.id, 1, updateFooterLink)} className="rounded border p-1 hover:bg-accent"><ArrowDown className="h-3 w-3" /></button>
                        </div>
                      </td>
                      <td className="p-1 text-right">
                        <button onClick={() => { if (confirm("Delete this link?")) void deleteFooterLink(l.id); }} className="text-rose-500 hover:underline text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {links.length === 0 && <tr><td colSpan={6} className="p-3 text-center text-xs text-muted-foreground">No links yet.</td></tr>}
                </tbody>
              </table>

              <button
                onClick={() => {
                  const label = prompt("Link label?");
                  if (!label) return;
                  const href = prompt("URL or path (e.g. /about or https://…)?") || "#";
                  const external = /^https?:\/\//i.test(href);
                  void addFooterLink(g.id, { label, href, external });
                }}
                className="mt-2 rounded border px-3 py-1 text-xs hover:bg-accent"
              >+ Add link</button>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
