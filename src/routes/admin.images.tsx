import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { listGalleryImages, type GalleryImage } from "@/lib/gallery";

export const Route = createFileRoute("/admin/images")({ component: AdminImages });

function AdminImages() {
  const [items, setItems] = useState<(GalleryImage & { filePath?: string })[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => listGalleryImages().then(setItems).catch(() => {});
  useEffect(() => { void load(); }, []);

  const upload = async () => {
    if (!file) return toast.error("Choose an image");
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      const base = (title || file.name.replace(/\.[^.]+$/, "")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image";
      const path = `${base}-${Date.now().toString(36)}.${ext}`;
      const up = await supabase.storage.from("gallery").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const ins = await (supabase as any).from("gallery_images").insert({ title: title || file.name, file_path: path, content_type: file.type || "image/png" });
      if (ins.error) throw ins.error;
      toast.success("Image added");
      setTitle(""); setFile(null); void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setBusy(false); }
  };

  const remove = async (img: GalleryImage & { filePath?: string }) => {
    if (!img.filePath) return;
    await supabase.storage.from("gallery").remove([img.filePath]);
    const { error } = await (supabase as any).from("gallery_images").delete().eq("id", img.id);
    if (error) return toast.error(error.message);
    toast("Removed"); void load();
  };

  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold">Image Gallery</h1>
      <p className="mt-1 text-sm opacity-70">Images appear on the public /images page. Each image gets a direct link.</p>
      <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-slate-700/50 p-4">
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 rounded border border-slate-600 bg-transparent px-3 py-2 text-sm" />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        <button disabled={busy} onClick={upload} className="rounded bg-sky-500 px-3 py-2 text-sm text-white disabled:opacity-50">{busy ? "Uploading…" : "Add image"}</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((img) => (
          <div key={img.id} className="rounded-xl border border-slate-700/50 p-3 text-sm">
            <img src={img.url} alt={img.title} className="aspect-square w-full rounded object-contain" />
            <div className="mt-2 font-medium">{img.title}</div>
            <a href={img.url} target="_blank" rel="noreferrer" className="block truncate font-mono text-xs text-sky-400">{img.url}</a>
            {img.builtIn ? <div className="mt-2 text-xs opacity-60">Built-in</div> : <button onClick={() => remove(img)} className="mt-2 rounded bg-rose-500/20 px-2 py-1 text-xs text-rose-300">Remove</button>}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
