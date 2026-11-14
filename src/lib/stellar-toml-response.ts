import stellarToml from "../../public/.well-known/stellar.toml?raw";

export const STELLAR_TOML_PATH = "/.well-known/stellar.toml";

// This resource is intentionally public; never apply these headers to app data.
export function stellarTomlResponse(request: Request): Response | undefined {
  if (new URL(request.url).pathname !== STELLAR_TOML_PATH) return undefined;
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Cloudflare-CDN-Cache-Control": "no-store",
  });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "GET" && request.method !== "HEAD") {
    headers.set("Allow", "GET, HEAD, OPTIONS");
    return new Response("Method not allowed", { status: 405, headers });
  }
  return new Response(request.method === "HEAD" ? null : stellarToml, { headers });
}