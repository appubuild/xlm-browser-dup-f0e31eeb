import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { buildMenuTree, createMenuItem, deleteMenuItem, listMenus, updateMenuItem, type MenuItem, type MenuLocation } from "@/lib/menus";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/menus")({
  component: AdminMenus,
  head: () => ({
    meta: [
      { title: "Menu Builder — XLM Browser Admin" },
      { name: "description", content: "Build the header drop-down menu and the user panel sidebar." },
      { property: "og:title", content: "Menu Builder — XLM Browser Admin" },
      { property: "og:description", content: "Manage header and panel navigation items." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const LOCATIONS: { key: MenuLocation; label: string; hint: string }[] = [
  { key: "header", label: "Header Menu", hint: "Top navigation. Items can have drop-down children." },
  { key: "panel", label: "User Panel Sidebar", hint: "Sidebar shown inside /panel for signed-in users." },
];

function AdminMenus() {
  const [location, setLocation] = useState<MenuLocation>("header");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [path, setPath] = useState("");
  const [icon, setIcon] = useState("");
  const [parentId, setParentId] = useState("");
  const [external, setExternal] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listMenus(location));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load menu");
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => { void reload(); }, [reload]);

  const tree = buildMenuTree(items.slice());
  const roots = items.filter((i) => !i.parentId);

  const add = async () => {
    if (!label.trim() || !path.trim()) { toast.error("Label and link are required"); return; }
    try {
      await createMenuItem({
        location,
        label: label.trim(),
        path: path.trim(),
        icon: icon.trim(),
        parentId: parentId || null,
        external,
        requiresAuth,
        sortOrder: items.length + 1,
      });
      setLabel(""); setPath(""); setIcon(""); setParentId(""); setExternal(false); setRequiresAuth(false);
      toast.success("Menu item added");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add item");
    }
  };

  const move = async (item: MenuItem, dir: -1 | 1) => {
    const siblings = items
      .filter((i) => i.parentId === item.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = siblings.findIndex((s) => s.id === item.id);
    const other = siblings[idx + dir];
    if (!other) return;
    try {
      await Promise.all([
        updateMenuItem(item.id, { sortOrder: other.sortOrder }),
        updateMenuItem(other.id, { sortOrder: item.sortOrder }),
      ]);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reorder");
    }
  };

  const patch = async (id: string, p: Partial<MenuItem>) => {
    try { await updateMenuItem(id, p); await reload(); toast.success("Saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); }
  };

  const remove = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.label}"${item.children.length ? " and its sub-items" : ""}?`)) return;
    try { await deleteMenuItem(item.id); await reload(); toast.success("Deleted"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete"); }
  };

  return (
    <AdminShell>
      <div>
        <h1 className="text-xl font-bold">Menu Builder</h1>
        <p className="mt-1 text-sm opacity-70">Create header drop-downs and manage the user panel sidebar. Footer links live under Navigation → Footer, and the public homepage sidebar under Navigation → Sidebar Menu.</p>

        <div className="mt-4 flex gap-2">
          {LOCATIONS.map((l) => (
            <button
              key={l.key}
              onClick={() => setLocation(l.key)}
              className={`rounded-md border px-3 py-1.5 text-sm ${location === l.key ? "bg-sky-500 text-white" : "opacity-80"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs opacity-60">{LOCATIONS.find((l) => l.key === location)?.hint}</p>

        <div className="admin-card mt-4 rounded-xl border p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
            <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Icon (emoji)" className="admin-input rounded border px-3 py-2 text-sm" />
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" className="admin-input rounded border px-3 py-2 text-sm md:col-span-2" />
            <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/path or https://…" className="admin-input rounded border px-3 py-2 text-sm md:col-span-2" />
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="admin-input rounded border px-3 py-2 text-sm">
              <option value="">Top level</option>
              {roots.map((r) => <option key={r.id} value={r.id}>↳ under {r.label}</option>)}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs opacity-80">
            <label className="flex items-center gap-2"><input type="checkbox" checked={external} onChange={(e) => setExternal(e.target.checked)} /> Open in new tab (external)</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={requiresAuth} onChange={(e) => setRequiresAuth(e.target.checked)} /> Signed-in users only</label>
            <button onClick={add} className="ml-auto rounded bg-sky-500 px-3 py-1.5 text-sm text-white">Add item</button>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-sm opacity-70">Loading…</div>
        ) : tree.length === 0 ? (
          <div className="mt-6 rounded-xl border p-8 text-center text-sm opacity-70">No items yet.</div>
        ) : (
          <ul className="mt-4 space-y-2">
            {tree.map((m) => (
              <li key={m.id} className="admin-card rounded-xl border p-3">
                <MenuRow item={m} onMove={move} onPatch={patch} onDelete={remove} />
                {m.children.length > 0 && (
                  <ul className="mt-2 space-y-2 border-l pl-4">
                    {m.children.map((c) => (
                      <li key={c.id}><MenuRow item={c} onMove={move} onPatch={patch} onDelete={remove} /></li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function MenuRow({
  item, onMove, onPatch, onDelete,
}: {
  item: MenuItem;
  onMove: (i: MenuItem, d: -1 | 1) => Promise<void>;
  onPatch: (id: string, p: Partial<MenuItem>) => Promise<void>;
  onDelete: (i: MenuItem) => Promise<void>;
}) {
  const [edit, setEdit] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [path, setPath] = useState(item.path);
  const [icon, setIcon] = useState(item.icon);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      {edit ? (
        <>
          <input value={icon} onChange={(e) => setIcon(e.target.value)} className="admin-input w-16 rounded border px-2 py-1" />
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="admin-input flex-1 rounded border px-2 py-1" />
          <input value={path} onChange={(e) => setPath(e.target.value)} className="admin-input w-56 rounded border px-2 py-1" />
        </>
      ) : (
        <>
          <span className="text-lg">{item.icon}</span>
          <span className="flex-1 font-medium">{item.label}</span>
          <span className="text-xs opacity-60">{item.path}</span>
          {item.external && <span className="rounded bg-sky-500/20 px-1.5 text-[10px] text-sky-400">external</span>}
          {item.requiresAuth && <span className="rounded bg-amber-500/20 px-1.5 text-[10px] text-amber-500">auth</span>}
        </>
      )}
      <label className="flex items-center gap-1 text-xs opacity-70">
        <input type="checkbox" checked={item.visible} onChange={(e) => onPatch(item.id, { visible: e.target.checked })} /> Visible
      </label>
      <button onClick={() => onMove(item, -1)} className="rounded border px-2">↑</button>
      <button onClick={() => onMove(item, 1)} className="rounded border px-2">↓</button>
      {edit ? (
        <button onClick={async () => { await onPatch(item.id, { label, path, icon }); setEdit(false); }} className="rounded bg-emerald-500 px-2 py-1 text-xs text-white">Save</button>
      ) : (
        <button onClick={() => setEdit(true)} className="rounded border px-2 py-1 text-xs">Edit</button>
      )}
      <button onClick={() => onDelete(item)} className="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10">Delete</button>
    </div>
  );
}
