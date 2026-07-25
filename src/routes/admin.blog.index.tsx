import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Copy, Trash2, Tag as TagIcon } from "lucide-react";

export const Route = createFileRoute("/admin/blog/")({ component: AdminBlog });

function AdminBlog() {
  const { news, addNews, deleteNews, updateNews, blogCategories, addBlogCategory, updateBlogCategory, deleteBlogCategory } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [showCats, setShowCats] = useState(false);

  const filtered = useMemo(() => news.filter((n) => {
    if (cat !== "All" && n.category !== cat) return false;
    if (status !== "all" && n.status !== status) return false;
    if (q && !(`${n.title} ${n.excerpt} ${(n.tags ?? []).join(" ")}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [news, cat, status, q]);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">News / Blog</h1>
          <div className="text-xs text-slate-400">{news.length} total · {news.filter((n) => n.status === "published").length} published</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowCats((v) => !v)} className="inline-flex items-center gap-1 rounded border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800">
            <TagIcon className="h-3.5 w-3.5" /> Categories
          </button>
          <Link to="/admin/blog/new" className="inline-flex items-center gap-1 rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-400">
            <Plus className="h-4 w-4" /> New article
          </Link>
        </div>
      </div>

      {showCats && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 text-sm font-semibold">Blog categories</div>
          <table className="w-full text-xs">
            <thead className="text-slate-400"><tr><th className="p-1 text-left">Name</th><th className="p-1 text-left">Slug</th><th className="p-1">Order</th><th className="p-1">Visible</th><th className="p-1"></th></tr></thead>
            <tbody>
              {blogCategories.map((c) => (
                <tr key={c.id} className="border-t border-slate-800">
                  <td className="p-1"><input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && void updateBlogCategory(c.id, { name: e.target.value })} className="w-full rounded bg-slate-950 px-2 py-1" /></td>
                  <td className="p-1"><input defaultValue={c.slug} onBlur={(e) => e.target.value !== c.slug && void updateBlogCategory(c.id, { slug: e.target.value })} className="w-full rounded bg-slate-950 px-2 py-1 font-mono" /></td>
                  <td className="p-1 text-center"><input type="number" defaultValue={c.sortOrder} onBlur={(e) => void updateBlogCategory(c.id, { sortOrder: parseInt(e.target.value) || 0 })} className="w-16 rounded bg-slate-950 px-2 py-1 text-center" /></td>
                  <td className="p-1 text-center"><input type="checkbox" checked={c.visible} onChange={(e) => void updateBlogCategory(c.id, { visible: e.target.checked })} /></td>
                  <td className="p-1 text-right"><button onClick={() => void deleteBlogCategory(c.id)} className="text-rose-400 hover:underline">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => {
              const name = prompt("Category name?");
              if (!name) return;
              const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              void addBlogCategory({ name, slug });
            }}
            className="mt-3 rounded border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800"
          >+ Add category</button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3">
        <div className="flex items-center gap-1 rounded border border-slate-700 px-2 py-1">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, tags…" className="w-56 bg-transparent text-xs outline-none" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs">
          <option>All</option>
          {blogCategories.map((c) => <option key={c.id}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as never)} className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs">
          <option value="all">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50 text-left text-xs text-slate-400">
            <tr>
              <th className="p-2">Cover</th><th className="p-2">Title</th><th className="p-2">Category</th><th className="p-2">Author</th>
              <th className="p-2">Date</th><th className="p-2">Status</th><th className="p-2">Views</th><th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-400">No posts match.</td></tr>}
            {filtered.map((n) => (
              <tr key={n.id} className="border-t border-slate-800/60">
                <td className="p-2">
                  <div className="h-12 w-16 overflow-hidden rounded bg-slate-800">
                    {n.coverImageUrl ? <img src={n.coverImageUrl} className="h-full w-full object-cover" alt="" /> : <div className="grid h-full w-full place-items-center text-xl">{n.coverImage}</div>}
                  </div>
                </td>
                <td className="p-2">
                  <div className="font-medium">{n.title}</div>
                  <div className="line-clamp-1 text-xs text-slate-400">{n.excerpt}</div>
                </td>
                <td className="p-2 text-xs text-slate-300">{n.category}</td>
                <td className="p-2 text-xs text-slate-400">{n.author}</td>
                <td className="p-2 text-xs text-slate-400">{n.publishDate}</td>
                <td className="p-2">
                  <button onClick={() => void updateNews(n.id, { status: n.status === "published" ? "draft" : "published" })}
                    className={`rounded px-2 py-0.5 text-[10px] capitalize ${n.status === "published" ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>{n.status}</button>
                </td>
                <td className="p-2 text-xs">{n.views}</td>
                <td className="p-2 text-right">
                  <div className="inline-flex items-center gap-2 text-xs">
                    <button onClick={() => nav({ to: "/admin/blog/$id", params: { id: n.id } })} className="inline-flex items-center gap-1 text-sky-400 hover:underline"><Pencil className="h-3 w-3" /> Edit</button>
                    <button onClick={() => { void addNews({ ...n, title: n.title + " (copy)", slug: n.slug + "-copy", status: "draft" }); toast("Duplicated"); }} className="inline-flex items-center gap-1 text-slate-300 hover:underline"><Copy className="h-3 w-3" /> Duplicate</button>
                    <button onClick={() => { if (confirm("Delete this post?")) { void deleteNews(n.id); toast("Deleted"); } }} className="inline-flex items-center gap-1 text-rose-400 hover:underline"><Trash2 className="h-3 w-3" /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
