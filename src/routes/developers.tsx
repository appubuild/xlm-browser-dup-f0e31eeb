import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";

export const Route = createFileRoute("/developers")({ component: Developers });

function Developers() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold">Developer Hub</h1>
        <p className="mt-2 text-muted-foreground">Build on XLM Browser and the Stellar Network.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { t: "REST API", d: "Query projects, categories and submissions.", to: "/developers/api" },
            { t: "SDK (JS)", d: "Coming soon — TypeScript SDK for XLM Browser." },
            { t: "Stellar RPC", d: "Public Stellar node endpoints and docs." },
          ].map((c) => (
            <div key={c.t} className="soft-card p-5">
              <div className="font-semibold">{c.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              {c.to && <Link to={c.to} className="mt-3 inline-block text-sm text-primary hover:underline">Read docs →</Link>}
            </div>
          ))}
        </div>
        <div className="soft-card mt-8 p-6">
          <div className="font-semibold">Stellar RPC endpoint (reference)</div>
          <pre className="mt-2 overflow-auto rounded bg-muted p-3 font-mono text-xs">https://horizon.stellar.org{"\n"}https://horizon.stellar.org</pre>
        </div>
      </div>
    </PublicShell>
  );
}
