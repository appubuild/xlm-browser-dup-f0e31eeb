import { createFileRoute } from "@tanstack/react-router";

// Serves admin-uploaded gallery images directly as image files (bucket is private).
export const Route = createFileRoute("/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });
        const { createAdminClient } = await import("@/lib/admin-db.server");
        const supabaseAdmin = createAdminClient();
        const { data: row } = await (supabaseAdmin as any).from("gallery_images").select("content_type").eq("file_path", path).maybeSingle();
        if (!row) return new Response("Not found", { status: 404 });
        const { data, error } = await supabaseAdmin.storage.from("gallery").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, { headers: { "Content-Type": row.content_type, "Cache-Control": "public, max-age=86400" } });
      },
    },
  },
});
