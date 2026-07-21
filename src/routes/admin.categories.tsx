import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({ component: AdminCategories });

function AdminCategories() {
  const { categories, setCategories } = useApp();
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= categories.length) return;
    const next = [...categories];
    [next[i], next[j]] = [next[j], next[i]];
    setCategories(next);
  };
  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold">Categories</h1>
      <table className="mt-4 w-full text-sm">
        <thead className="border-b border-slate-800 text-left text-slate-400"><tr><th className="p-2">Order</th><th className="p-2">Icon</th><th className="p-2">Name</th><th className="p-2">Description</th><th className="p-2">Visible</th><th className="p-2">Actions</th></tr></thead>
        <tbody>
          {categories.map((c, i) => (
            <tr key={c.id} className="border-b border-slate-800/60">
              <td className="p-2"><button onClick={() => move(i, -1)} className="mr-1 rounded border border-slate-700 px-1">↑</button><button onClick={() => move(i, 1)} className="rounded border border-slate-700 px-1">↓</button></td>
              <td className="p-2 text-2xl">{c.icon}</td>
              <td className="p-2 font-medium">{c.name}</td>
              <td className="p-2 text-slate-400">{c.description}</td>
              <td className="p-2"><input type="checkbox" checked={c.visible} onChange={(e) => setCategories(categories.map((x) => x.id === c.id ? { ...x, visible: e.target.checked } : x))} /></td>
              <td className="p-2 text-xs">
                <button onClick={() => toast("Edit modal (mock)")} className="text-sky-400 hover:underline">Edit</button>
                {" · "}
                <button onClick={() => { if (confirm("Delete?")) { setCategories(categories.filter((x) => x.id !== c.id)); toast("Deleted"); } }} className="text-rose-400 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => toast("New category form (mock)")} className="mt-4 rounded bg-sky-500 px-3 py-1.5 text-sm text-white">+ Add category</button>
    </AdminShell>
  );
}
