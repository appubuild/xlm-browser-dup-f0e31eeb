import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/envcheck")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          JSON.stringify({
            url: !!process.env.SUPABASE_URL,
            svc: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            sb: !!process.env.SB_SERVICE_ROLE_KEY,
            xaman: !!process.env.XAMAN_API_KEY,
          }),
          { headers: { "content-type": "application/json" } },
        ),
    },
  },
});
