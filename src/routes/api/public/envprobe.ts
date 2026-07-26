import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/envprobe")({
  server: {
    handlers: {
      GET: async () => {
        const names = ["XAMAN_API_KEY", "XAMAN_API_SECRET", "SB_SERVICE_ROLE_KEY", "SUPABASE_URL"];
        const out: Record<string, boolean> = {};
        for (const n of names) out[n] = Boolean(process.env?.[n]);
        return Response.json(out);
      },
    },
  },
});
