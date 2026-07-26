import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RichEditor } from "@/components/rich-editor";
import { createPage, updatePage, deletePage, type SitePage } from "@/lib/cms";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function PageEditor({ initial }: { initial?: SitePage }) {
  const nav = useNavigate();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [meta, setMeta] = useState(initial?.metaDescription ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [showInFooter, setShowInFooter] = useState(initial?.showInFooter ?? false);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initial && title && !slug) setSlug(slugify(title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const input = "w-full rounded-md border bg-background px-3 py-2 text-sm";

  const save = async () => {
    if (!title.trim() || !slug.trim()) { toast.error("Title and slug are required"); return; }
    setSaving(true);
    try {
      const payload = { title: title.trim(), slug: slugify(slug), body, metaDescription: meta, published, showInFooter, sortOrder };
      if (initial) {
        await updatePage(initial.id, payload);
        toast.success("Page saved");
      } else {
        await createPage(payload);
        toast.success("Page created");
        nav({ to: "/admin/pages" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{initial ? "Edit page" : "New page"}</h1>
        <div className="flex gap-2">
          <button onClick={() => nav({ to: "/admin/pages" })} className="rounded border px-3 py-1.5 text-sm">Back</button>
          {initial && (
            <button
              onClick={async () => {
                if (!confirm("Delete this page?")) return;
                await deletePage(initial.id);
                toast("Page deleted");
                nav({ to: "/admin/pages" });
              }}
              className="rounded border border-rose-500/50 px-3 py-1.5 text-sm text-rose-400"
            >Delete</button>
          )}
          <button onClick={() => void save()} disabled={saving} className="rounded bg-sky-500 px-4 py-1.5 text-sm text-white hover:bg-sky-400 disabled:opacity-60">
            {saving ? "Saving…" : "Save page"}
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-4 rounded-xl border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs opacity-70">Title *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} placeholder="About us" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs opacity-70">Slug * (URL: /p/slug)</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={`${input} font-mono`} placeholder="about-us" />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-xs opacity-70">Content (HTML supported)</span>
          <RichEditor value={body} onChange={setBody} minHeight={320} placeholder="Write the page content…" />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs opacity-70">Meta description (SEO)</span>
          <textarea value={meta} onChange={(e) => setMeta(e.target.value)} rows={2} maxLength={200} className={input} />
        </label>

        <div className="flex flex-wrap items-center gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={showInFooter} onChange={(e) => setShowInFooter(e.target.checked)} /> Show in footer</label>
          <label className="flex items-center gap-2">Order
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="w-20 rounded-md border bg-background px-2 py-1" />
          </label>
        </div>
      </div>
    </div>
  );
}
