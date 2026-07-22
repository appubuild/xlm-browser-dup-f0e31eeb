import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp, type SidebarItem } from "@/lib/app-store";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sidebar")({ component: AdminSidebarPage });

function AdminSidebarPage() {
  const { sidebarItems, addSidebarItem, updateSidebarItem, deleteSidebarItem, reorderSidebar } = useApp();
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("📄");
  const [path, setPath] = useState("");
  const [requiresAuth, setRequiresAuth] = useState(false);

  const sorted = [...sidebarItems].sort((a, b) => a.sortOrder - b.sortOrder);

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const ids = sorted.map((s) => s.id);
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    await reorderSidebar(ids);
  };

  const add = async () => {
    if (!label || !path) { toast.error("Label and path required"); return; }
    await addSidebarItem({ label, icon, path, requiresAuth, sortOrder: sorted.length + 1 });
    setLabel(""); setPath(""); setIcon("📄"); setRequiresAuth(false);
    toast.success("Menu item added");
  };

  return (
    <AdminShell>
      <div>
        <h1 className="text-xl font-bold">Sidebar Menu</h1>
        <p className="mt-1 text-sm text-slate-400">Add, edit, reorder, hide or delete items in the public sidebar.</p>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
            <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Icon (emoji)" className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm md:col-span-2" />
            <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/path" className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={requiresAuth} onChange={(e) => setRequiresAuth(e.target.checked)} /> Auth only</label>
          </div>
          <div className="mt-3 flex justify-end"><button onClick={add} className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white">Add item</button></div>
        </div>

        <ul className="mt-4 space-y-2">
          {sorted.map((s, i) => <Row key={s.id} item={s} idx={i} total={sorted.length} onMove={move} onUpdate={updateSidebarItem} onDelete={deleteSidebarItem} />)}
        </ul>
      </div>
    </AdminShell>
  );
}

function Row({ item, idx, total, onMove, onUpdate, onDelete }: {
  item: SidebarItem; idx: number; total: number;
  onMove: (i: number, d: -1 | 1) => Promise<void>;
  onUpdate: (id: string, p: Partial<SidebarItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [edit, setEdit] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [icon, setIcon] = useState(item.icon);
  const [path, setPath] = useState(item.path);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
      <span className="w-6 text-slate-500">#{idx + 1}</span>
      {edit ? (
        <>
          <input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-16 rounded border border-slate-700 bg-slate-800 px-2 py-1" />
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="flex-1 rounded border border-slate-700 bg-slate-800 px-2 py-1" />
          <input value={path} onChange={(e) => setPath(e.target.value)} className="w-40 rounded border border-slate-700 bg-slate-800 px-2 py-1" />
        </>
      ) : (
        <>
          <span className="text-xl">{item.icon}</span>
          <span className="flex-1 font-medium">{item.label}</span>
          <span className="text-xs text-slate-400">{item.path}</span>
          {item.requiresAuth && <span className="rounded bg-amber-500/20 px-1.5 text-[10px] text-amber-300">auth</span>}
        </>
      )}
      <label className="flex items-center gap-1 text-xs text-slate-400"><input type="checkbox" checked={item.visible} onChange={(e) => onUpdate(item.id, { visible: e.target.checked })} /> Visible</label>
      <button onClick={() => onMove(idx, -1)} disabled={idx === 0} className="rounded border border-slate-700 px-2 disabled:opacity-30">↑</button>
      <button onClick={() => onMove(idx, 1)} disabled={idx === total - 1} className="rounded border border-slate-700 px-2 disabled:opacity-30">↓</button>
      {edit ? (
        <button onClick={async () => { await onUpdate(item.id, { label, icon, path }); setEdit(false); toast.success("Saved"); }} className="rounded bg-emerald-500 px-2 py-1 text-xs text-white">Save</button>
      ) : (
        <button onClick={() => setEdit(true)} className="rounded border border-slate-700 px-2 py-1 text-xs">Edit</button>
      )}
      <button onClick={() => { if (confirm(`Delete "${item.label}"?`)) onDelete(item.id); }} className="rounded border border-rose-500/40 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10">Delete</button>
    </li>
  );
}
