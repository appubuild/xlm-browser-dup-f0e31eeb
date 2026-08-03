import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/developers/api")({ component: DevAPI });

function DevAPI() {
  const [key, setKey] = useState("");
  const endpoints = [
    { m: "GET", p: "/projects", d: "List all projects" },
    { m: "GET", p: "/project/:id", d: "Get a project by id or slug" },
    { m: "GET", p: "/categories", d: "List categories" },
    { m: "POST", p: "/submit", d: "Submit a new project" },
  ];
  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold">Developer API</h1>
        <p className="mt-2 text-muted-foreground">REST endpoints for the XLM Browser directory (mock).</p>

        <div className="soft-card mt-6 p-5">
          <div className="mb-2 font-semibold">API Key</div>
          <div className="flex gap-2">
            <input readOnly value={key} placeholder="No key generated yet" className="flex-1 rounded border bg-background px-3 py-2 font-mono text-sm" />
            <button onClick={() => { const k = "xrpb_" + Math.random().toString(36).slice(2, 14); setKey(k); toast.success("API key generated"); }} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Generate</button>
            <button onClick={() => { navigator.clipboard.writeText(key); toast("Copied"); }} disabled={!key} className="rounded border px-4 py-2 text-sm disabled:opacity-50">Copy</button>
          </div>
        </div>

        <h2 className="mt-8 text-xl font-bold">Endpoints</h2>
        <div className="mt-3 space-y-2">
          {endpoints.map((e) => (
            <div key={e.p} className="soft-card flex items-center gap-3 p-3 font-mono text-sm">
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${e.m === "GET" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>{e.m}</span>
              <span className="flex-1">{e.p}</span>
              <span className="text-muted-foreground">{e.d}</span>
            </div>
          ))}
        </div>

        <h2 className="mt-8 text-xl font-bold">Example</h2>
        <pre className="soft-card mt-3 overflow-auto p-4 font-mono text-xs">{`GET /projects?category=wallets
{
  "results": [
    { "id": "1", "slug": "freighter", "name": "Freighter", "verified": true }
  ]
}`}</pre>
      </div>
    </PublicShell>
  );
}
