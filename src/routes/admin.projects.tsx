import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { CATEGORIES } from "@/lib/mock-data";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { ProjectBadges } from "@/components/project-badges";
import type { Project } from "@/lib/app-store";

export const Route = createFileRoute("/admin/projects")({ component: AdminProjects });

function AdminProjects() {
  const { projects, updateProject, deleteProject } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [sel, setSel] = useState<string[]>([]);
  const [editFor, setEditFor] = useState<Project | null>(null);

  const items = projects.filter((p) =>
    (cat === "all" || p.category === cat) &&
    (status === "all" || p.status === status) &&
    (!q || p.name.toLowerCase().includes(q.toLowerCase()))
  );

  const toggleSel = (id: string) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link to="/submit" className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-400">+ Add New</Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm">
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        {sel.length > 0 && (
          <div className="ml-auto flex gap-2">
            <button onClick={() => { sel.forEach((id) => updateProject(id, { status: "approved" })); setSel([]); toast.success("Bulk approved"); }} className="rounded bg-green-500/20 px-3 py-1.5 text-sm text-green-300">Bulk approve</button>
            <button onClick={() => { sel.forEach((id) => deleteProject(id)); setSel([]); toast("Bulk deleted"); }} className="rounded bg-rose-500/20 px-3 py-1.5 text-sm text-rose-300">Bulk delete</button>
          </div>
        )}
      </div>

      <table className="mt-4 w-full text-sm">
        <thead className="border-b border-slate-800 text-left text-slate-400">
          <tr>
            <th className="p-2"><input type="checkbox" onChange={(e) => setSel(e.target.checked ? items.map((i) => i.id) : [])} /></th>
            <th className="p-2">Logo</th><th className="p-2">Name</th><th className="p-2">Category</th>
            <th className="p-2">Status</th><th className="p-2">Date</th><th className="p-2">Visits</th><th className="p-2">Featured</th><th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-b border-slate-800/60">
              <td className="p-2"><input type="checkbox" checked={sel.includes(p.id)} onChange={() => toggleSel(p.id)} /></td>
              <td className="p-2 text-xl">{p.logo}</td>
              <td className="p-2 font-medium">
                <div>{p.name}</div>
                <ProjectBadges badges={p.badges} size="xs" className="mt-1" />
              </td>
              <td className="p-2 capitalize">{p.category}</td>
              <td className="p-2"><span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs capitalize">{p.status}</span></td>
              <td className="p-2 text-slate-400">{p.dateAdded}</td>
              <td className="p-2">{p.visits.toLocaleString()}</td>
              <td className="p-2"><button onClick={() => { updateProject(p.id, { featured: !p.featured }); toast(p.featured ? "Unfeatured" : "Featured"); }} className={`rounded px-2 py-0.5 text-xs ${p.featured ? "bg-sky-500/20 text-sky-300" : "bg-slate-800 text-slate-400"}`}>{p.featured ? "★ Yes" : "☆ No"}</button></td>
              <td className="p-2">
                <div className="flex gap-2 text-xs">
                  <Link to="/project/$slug" params={{ slug: p.slug }} className="text-sky-400 hover:underline">View</Link>
                  <button onClick={() => setEditFor(p)} className="text-sky-300 hover:underline">Edit</button>
                  <button onClick={() => { updateProject(p.id, { isPublic: !p.isPublic }); toast(p.isPublic ? "Unpublished" : "Published"); }} className="text-amber-300 hover:underline">{p.isPublic ? "Unpublish" : "Publish"}</button>
                  {p.status === "pending" && <button onClick={() => { updateProject(p.id, { status: "approved" }); toast.success("Approved"); }} className="text-green-400 hover:underline">Approve</button>}
                  <button onClick={() => { if (confirm(`Delete ${p.name}?`)) { deleteProject(p.id); toast("Deleted"); } }} className="text-rose-400 hover:underline">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ProjectFormDialog project={editFor} mode="admin" onClose={() => setEditFor(null)} />
    </AdminShell>
  );
}
