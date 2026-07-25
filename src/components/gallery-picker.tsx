import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-store";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { X, Upload, Image as ImgIcon, Search } from "lucide-react";

interface Props {
  value?: string;
  onSelect: (url: string) => void;
  onClose?: () => void;
  open: boolean;
}

export function GalleryPicker({ open, value, onSelect, onClose }: Props) {
  const { mediaGallery, addMedia, deleteMedia, siteSettings, isAdmin } = useApp();
  const [busy, setBusy] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [q, setQ] = useState("");

  if (!open) return null;

  const handleFile = async (file: File) => {
    if (!siteSettings.cloudinaryCloudName || !siteSettings.cloudinaryUploadPreset) {
      toast.error("Cloudinary not configured (Admin → Site Settings)");
      return;
    }
    setBusy(true);
    try {
      const url = await uploadToCloudinary(file, siteSettings.cloudinaryCloudName, siteSettings.cloudinaryUploadPreset);
      await addMedia({ url, filename: file.name });
      onSelect(url);
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const items = mediaGallery.filter((m) => !q || (m.filename ?? "").toLowerCase().includes(q.toLowerCase()) || m.url.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><ImgIcon className="h-4 w-4" /> Media Gallery</div>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded border px-3 py-1.5 text-xs hover:bg-muted">
            <Upload className="h-3.5 w-3.5" /> {busy ? "Uploading…" : "Upload"}
            <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
          </label>
          <div className="flex items-center gap-1 rounded border px-2 py-1">
            <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Paste image URL" className="w-64 bg-transparent text-xs outline-none" />
            <button
              disabled={!urlInput.trim()}
              onClick={async () => {
                const url = urlInput.trim();
                await addMedia({ url });
                onSelect(url);
                setUrlInput("");
              }}
              className="rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground disabled:opacity-50"
            >Add</button>
          </div>
          <div className="ml-auto flex items-center gap-1 rounded border px-2 py-1">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-40 bg-transparent text-xs outline-none" />
          </div>
        </div>
        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.length === 0 && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No images yet. Upload one to get started.</div>}
          {items.map((m) => {
            const active = value === m.url;
            return (
              <div key={m.id} className={`group relative overflow-hidden rounded-lg border ${active ? "ring-2 ring-primary" : ""}`}>
                <button type="button" onClick={() => onSelect(m.url)} className="block h-28 w-full">
                  <img src={m.url} alt={m.filename ?? ""} className="h-full w-full object-cover" loading="lazy" />
                </button>
                {isAdmin && (
                  <button onClick={() => void deleteMedia(m.id)} className="absolute right-1 top-1 hidden rounded bg-black/70 p-1 text-white group-hover:block">
                    <X className="h-3 w-3" />
                  </button>
                )}
                {m.filename && <div className="truncate p-1 text-[10px] text-muted-foreground">{m.filename}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
