import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { listPages, updatePage, deletePage, type SitePage } from "@/lib/cms";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/pages/")({ component: AdminPages });

function AdminPages() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const load = async () => {
    try { setPages(await listPages(true)); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load"); }
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pages</h1>
          <div className="text-xs opacity-60">{pages.length} pages · custom HTML pages served at /p/&lt;slug&gt;</div>
        </div>
        <Link to="/admin/pages/new" className="inline-flex items-center gap-1 rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-400">
          <Plus className="h-4 w-4" /> New page
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="text-left text-xs opacity-60">
            <tr><th className="p-2">Title</th><th className="p-2">Slug</th><th className="p-2">Order</th><th className="p-2">Footer</th><th className="p-2">Published</th><th className="p-2"></th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-8 text-center opacity-60">Loading…</td></tr>}
            {!loading && pages.length === 0 && <tr><td colSpan={6} className="p-8 text-center opacity-60">No pages yet.</td></tr>}
            {pages.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-medium">{p.title}</td>
                <td className="p-2 font-mono text-xs opacity-70">/p/{p.slug}</td>
                <td className="p-2">
                  <input type="number" defaultValue={p.sortOrder} onBlur={async (e) => { await updatePage(p.id, { sortOrder: parseInt(e.target.value) || 0 }); void load(); }} className="w-16 rounded border bg-background px-2 py-1 text-center text-xs" />
                </td>
                <td className="p-2 text-center">
                  <input type="checkbox" checked={p.showInFooter} onChange={async (e) => { await updatePage(p.id, { showInFooter: e.target.checked }); void load(); }} />
                </td>
                <td className="p-2 text-center">
                  <input type="checkbox" checked={p.published} onChange={async (e) => { await updatePage(p.id, { published: e.target.checked }); void load(); }} />
                </td>
                <td className="p-2 text-right">
                  <div className="inline-flex items-center gap-3 text-xs">
                    <Link to="/p/$slug" params={{ slug: p.slug }} className="inline-flex items-center gap-1 opacity-70 hover:underline"><ExternalLink className="h-3 w-3" /> View</Link>
                    <button onClick={() => nav({ to: "/admin/pages/$id", params: { id: p.id } })} className="inline-flex items-center gap-1 text-sky-400 hover:underline"><Pencil className="h-3 w-3" /> Edit</button>
                    <button onClick={async () => { if (confirm("Delete this page?")) { await deletePage(p.id); toast("Deleted"); void load(); } }} className="inline-flex items-center gap-1 text-rose-400 hover:underline"><Trash2 className="h-3 w-3" /> Delete</button>
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
