import { supabase } from "@/integrations/supabase/client";

export type GalleryImage = { id: string; title: string; url: string; builtIn?: boolean };

export const BUILT_IN_IMAGES: GalleryImage[] = [
  { id: "logo-512", title: "XLM Browser logo 512×512", url: "/images/logo-512.png", builtIn: true },
  { id: "logo-1024", title: "XLM Browser logo 1024×1024", url: "/images/logo-1024.png", builtIn: true },
];

export async function listGalleryImages(): Promise<(GalleryImage & { filePath?: string })[]> {
  const { data } = await (supabase as any).from("gallery_images").select("id,title,file_path").order("created_at", { ascending: false });
  const uploaded = (data ?? []).map((r: { id: string; title: string; file_path: string }) => ({ id: r.id, title: r.title, url: `/media/${r.file_path}`, filePath: r.file_path }));
  return [...BUILT_IN_IMAGES, ...uploaded];
}
