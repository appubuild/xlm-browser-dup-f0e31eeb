import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useApp, type NewsArticle } from "@/lib/app-store";
import { RichEditor } from "@/components/rich-editor";
import { GalleryPicker } from "@/components/gallery-picker";
import { useServerFn } from "@tanstack/react-start";
import { generateBlogPost, generateBlogSeo } from "@/lib/ai.functions";
import { Sparkles, Image as ImgIcon, ArrowLeft, Save, Wand2, Bot, Loader2 } from "lucide-react";

type Draft = Omit<NewsArticle, "id" | "views">;

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function BlogEditor({ initial, id }: { initial?: NewsArticle; id?: string }) {
  const { user, blogCategories, siteSettings, addNews, updateNews } = useApp();
  const nav = useNavigate();
  const [d, setD] = useState<Draft>({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    category: initial?.category ?? (blogCategories[0]?.name ?? "Announcements"),
    author: initial?.author ?? (user?.name ?? "Admin"),
    coverImage: initial?.coverImage ?? "📰",
    coverImageUrl: initial?.coverImageUrl ?? "",
    excerpt: initial?.excerpt ?? "",
    body: initial?.body ?? "",
    publishDate: initial?.publishDate ?? new Date().toISOString().slice(0, 10),
    status: initial?.status ?? "draft",
    metaDescription: initial?.metaDescription ?? "",
    seoKeywords: initial?.seoKeywords ?? "",
    tags: initial?.tags ?? [],
    gallery: initial?.gallery ?? [],
  });
  const [angle, setAngle] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [seoBusy, setSeoBusy] = useState(false);
  const [pickerFor, setPickerFor] = useState<"cover" | null>(null);

  const aiWrite = useServerFn(generateBlogPost);
  const aiSeo = useServerFn(generateBlogSeo);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((s) => ({ ...s, [k]: v }));

  const handleWrite = async () => {
    setAiBusy(true);
    try {
      const r = await aiWrite({ data: { category: d.category, angle, instruction: siteSettings.aiDefaultInstruction } });
      setD((s) => ({
        ...s,
        title: r.title || s.title,
        excerpt: r.excerpt || s.excerpt,
        body: r.body || s.body,
        tags: r.tags?.length ? r.tags : s.tags,
        slug: s.slug || slugify(r.title || s.title),
      }));
      toast.success("Draft generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally { setAiBusy(false); }
  };

  const handleSeo = async () => {
    if (!d.title || !d.body) { toast.error("Add a title and content first"); return; }
    setSeoBusy(true);
    try {
      const r = await aiSeo({ data: { title: d.title, body: d.body } });
      setD((s) => ({
        ...s,
        metaDescription: r.metaDescription || s.metaDescription,
        seoKeywords: r.keywords.length ? r.keywords.join(", ") : s.seoKeywords,
        slug: s.slug || r.slug || slugify(s.title),
      }));
      toast.success("SEO generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally { setSeoBusy(false); }
  };

  const save = async () => {
    if (!d.title.trim()) { toast.error("Title required"); return; }
    const slug = d.slug.trim() || slugify(d.title);
    const payload: Draft = { ...d, slug };
    try {
      if (id) { await updateNews(id, payload); toast.success("Saved"); }
      else { await addNews(payload); toast.success("Created"); }
      nav({ to: "/admin/blog" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-3">
        <button onClick={() => nav({ to: "/admin/blog" })} className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div>
          <div className="text-lg font-semibold">{id ? "Edit post" : "New post"}</div>
          <div className="text-xs text-slate-400">/news/{d.slug || "…"}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" checked={d.status === "published"} onChange={(e) => set("status", e.target.checked ? "published" : "draft")} />
            Published
          </label>
          <button onClick={handleSeo} disabled={seoBusy} className="inline-flex items-center gap-1 rounded border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800 disabled:opacity-50">
            <Wand2 className="h-3.5 w-3.5" /> {seoBusy ? "AI…" : "AI: SEO"}
          </button>
          <button onClick={save} className="inline-flex items-center gap-1 rounded bg-sky-500 px-3 py-1.5 text-sm text-white hover:bg-sky-400">
            <Save className="h-3.5 w-3.5" /> Save post
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <F label="Title">
            <input value={d.title} onChange={(e) => { const t = e.target.value; setD((s) => ({ ...s, title: t, slug: s.slug || slugify(t) })); }}
              placeholder="Post title…" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-lg" />
          </F>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">AI Writer</div>
            <div className="mt-1 text-xs text-slate-400">Choose a category on the right, add an optional angle, then generate the full article, excerpt & SEO.</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="flex-1 text-xs">
                <div className="mb-1 text-slate-400">Topic / angle (optional)</div>
                <input value={angle} onChange={(e) => setAngle(e.target.value)} placeholder="e.g. Why Stellar EVM sidechain matters"
                  className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
              </label>
              <button onClick={handleWrite} disabled={aiBusy} className="mt-5 inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs hover:bg-slate-800 disabled:opacity-50">
                <Sparkles className="h-3.5 w-3.5" /> {aiBusy ? "Writing…" : "AI: Write post"}
              </button>
            </div>
          </div>

          <F label="Excerpt">
            <textarea value={d.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          </F>

          <F label="Content">
            <RichEditor value={d.body} onChange={(v) => set("body", v)} minHeight={360} placeholder="Write your post…" />
          </F>
        </div>

        <aside className="space-y-4">
          <F label="Slug"><input value={d.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder="my-first-post" className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" /></F>
          <F label="Category">
            <select value={d.category} onChange={(e) => set("category", e.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              <option value="">(none)</option>
              {blogCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </F>
          <F label="Author name"><input value={d.author} onChange={(e) => set("author", e.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" /></F>
          <F label="Cover image">
            <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
              {d.coverImageUrl
                ? <img src={d.coverImageUrl} className="h-40 w-full object-cover" alt="" />
                : <div className="grid h-40 place-items-center text-3xl text-slate-500">{d.coverImage || "EMPTY"}</div>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setPickerFor("cover")} className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800">
                <ImgIcon className="h-3.5 w-3.5" /> Upload / Gallery
              </button>
              <input value={d.coverImageUrl ?? ""} onChange={(e) => set("coverImageUrl", e.target.value)} placeholder="or paste image URL"
                className="flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs" />
            </div>
            <input value={d.coverImage} onChange={(e) => set("coverImage", e.target.value)} placeholder="Fallback emoji"
              className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs" />
          </F>
          <F label="Meta description (SEO)">
            <textarea value={d.metaDescription ?? ""} onChange={(e) => set("metaDescription", e.target.value)} rows={3}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          </F>
          <F label="SEO keywords (comma separated)">
            <input value={d.seoKeywords ?? ""} onChange={(e) => set("seoKeywords", e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          </F>
          <F label="Tags (comma separated)">
            <input value={(d.tags ?? []).join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          </F>
          <F label="Publish date">
            <input type="date" value={d.publishDate} onChange={(e) => set("publishDate", e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          </F>
        </aside>
      </div>

      {aiBusy && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-sky-400/30 bg-slate-900 p-6 text-center text-slate-100 shadow-2xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sky-500/15 text-sky-300">
              <Bot className="h-8 w-8" />
            </div>
            <div className="mt-4 text-lg font-semibold">AI robot is writing</div>
            <div className="mt-2 text-sm text-slate-400">Generating your blog draft, excerpt, and tags…</div>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-sky-300">
              <Loader2 className="h-4 w-4 animate-spin" /> Please wait
            </div>
          </div>
        </div>
      )}

      <GalleryPicker open={pickerFor === "cover"} value={d.coverImageUrl} onClose={() => setPickerFor(null)} onSelect={(url) => { set("coverImageUrl", url); setPickerFor(null); }} />
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs"><div className="mb-1 font-medium text-slate-300">{label}</div>{children}</label>;
}
