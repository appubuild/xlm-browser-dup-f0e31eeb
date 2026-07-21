import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/blog")({ component: AdminBlog });

function AdminBlog() {
  const { news, addNews, updateNews, deleteNews } = useApp();
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState({ title: "", category: "Announcements", author: "Admin", coverImage: "📰", excerpt: "", body: "", status: "published" as "draft" | "published" });
  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">News / Blog</h1>
        <button onClick={() => setCreating((v) => !v)} className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white">+ New Article</button>
      </div>
      {creating && (
        <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm">
          <input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" />
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="rounded border border-slate-700 bg-slate-950 px-3 py-2" />
            <input placeholder="Author" value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} className="rounded border border-slate-700 bg-slate-950 px-3 py-2" />
            <input placeholder="Cover (emoji)" value={f.coverImage} onChange={(e) => setF({ ...f, coverImage: e.target.value })} className="rounded border border-slate-700 bg-slate-950 px-3 py-2" />
          </div>
          <input placeholder="Excerpt" value={f.excerpt} onChange={(e) => setF({ ...f, excerpt: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" />
          <textarea placeholder="Body" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} className="min-h-24 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" />
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={f.status === "published"} onChange={(e) => setF({ ...f, status: e.target.checked ? "published" : "draft" })} /> Publish immediately</label>
          <button onClick={() => { addNews({ ...f, slug: f.title.toLowerCase().replace(/\s+/g, "-"), publishDate: new Date().toISOString().slice(0, 10) }); toast.success("Article created"); setCreating(false); }} className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white">Create</button>
        </div>
      )}
      <table className="mt-4 w-full text-sm">
        <thead className="border-b border-slate-800 text-left text-slate-400"><tr>
          <th className="p-2">Title</th><th className="p-2">Category</th><th className="p-2">Author</th><th className="p-2">Date</th><th className="p-2">Status</th><th className="p-2">Views</th><th className="p-2">Actions</th>
        </tr></thead>
        <tbody>
          {news.map((n) => (
            <tr key={n.id} className="border-b border-slate-800/60">
              <td className="p-2 font-medium">{n.coverImage} {n.title}</td>
              <td className="p-2">{n.category}</td>
              <td className="p-2 text-slate-400">{n.author}</td>
              <td className="p-2 text-slate-400">{n.publishDate}</td>
              <td className="p-2"><button onClick={() => updateNews(n.id, { status: n.status === "published" ? "draft" : "published" })} className="rounded bg-slate-800 px-2 py-0.5 text-xs capitalize">{n.status}</button></td>
              <td className="p-2">{n.views}</td>
              <td className="p-2 text-xs">
                <button onClick={() => toast("Edit (mock)")} className="text-sky-400 hover:underline">Edit</button>
                {" · "}
                <button onClick={() => { addNews({ ...n, title: n.title + " (copy)", slug: n.slug + "-copy" }); toast("Duplicated"); }} className="text-slate-300 hover:underline">Duplicate</button>
                {" · "}
                <button onClick={() => { deleteNews(n.id); toast("Deleted"); }} className="text-rose-400 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminShell>
  );
}
