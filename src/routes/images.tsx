import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { BUILT_IN_IMAGES, listGalleryImages, type GalleryImage } from "@/lib/gallery";

export const Route = createFileRoute("/images")({
  head: () => ({
    meta: [
      { title: "Image Gallery — XLM Browser" },
      { name: "description", content: "Official XLM Browser logos and brand images, with direct PNG links." },
      { property: "og:title", content: "Image Gallery — XLM Browser" },
      { property: "og:description", content: "Official XLM Browser logos and brand images." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImagesPage,
});

function ImagesPage() {
  const [items, setItems] = useState<GalleryImage[]>(BUILT_IN_IMAGES);
  useEffect(() => { listGalleryImages().then(setItems).catch(() => {}); }, []);
  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold">Image Gallery</h1>
        <p className="mt-2 text-muted-foreground">Official XLM Browser images. Click an image to open the file directly.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((img) => (
            <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="soft-card block overflow-hidden p-3">
              <div className="flex aspect-square items-center justify-center rounded-xl bg-muted">
                <img src={img.url} alt={img.title} loading="lazy" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="mt-3 font-medium">{img.title}</div>
              <div className="truncate font-mono text-xs text-muted-foreground">{img.url}</div>
            </a>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
