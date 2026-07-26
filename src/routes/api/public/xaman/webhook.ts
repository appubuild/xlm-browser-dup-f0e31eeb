import { createFileRoute } from "@tanstack/react-router";

/**
 * Xaman (Xumm) webhook endpoint.
 * Paste this URL in apps.xaman.dev → your app → "Webhook URL for callbacks":
 *   https://<your-domain>/api/public/xaman/webhook
 * Xaman POSTs payload lifecycle events (signed / rejected / expired) here.
 * The app also polls payload status, so this endpoint is optional — it just
 * acknowledges deliveries so Xaman doesn't mark the hook as failing.
 */
export const Route = createFileRoute("/api/public/xaman/webhook")({
  server: {
    handlers: {
      GET: () => Response.json({ ok: true, endpoint: "xaman-webhook" }),
      POST: async ({ request }) => {
        let payload: unknown = null;
        try {
          payload = await request.json();
        } catch {
          payload = null;
        }
        const meta = (payload as { payloadResponse?: { payload_uuidv4?: string; signed?: boolean } } | null)
          ?.payloadResponse;
        console.log("[xaman webhook]", meta?.payload_uuidv4 ?? "unknown", "signed:", meta?.signed ?? "n/a");
        return Response.json({ ok: true });
      },
      OPTIONS: () => new Response(null, { status: 204 }),
    },
  },
});
