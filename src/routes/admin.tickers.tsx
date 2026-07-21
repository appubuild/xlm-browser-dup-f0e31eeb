import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/tickers")({ component: AdminTickers });

function AdminTickers() {
  const { tickers, setTickers, projects } = useApp();
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold">Trending Tickers</h1>
      <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} className="flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
        <select value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
          <option value="">Link to project (optional)</option>
          {projects.filter((p) => p.status === "approved").map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}
        </select>
        <button onClick={() => { if (!label) return; setTickers([...tickers, { id: Math.random().toString(36).slice(2), label, linkedProjectSlug: slug || undefined, order: tickers.length + 1 }]); setLabel(""); setSlug(""); toast.success("Ticker added"); }} className="rounded bg-sky-500 px-3 py-2 text-sm text-white">Add</button>
      </div>
      <ul className="mt-4 space-y-2">
        {tickers.map((t, i) => (
          <li key={t.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
            <span className="text-slate-400">#{i + 1}</span>
            <span className="flex-1">{t.label}</span>
            {t.linkedProjectSlug && <span className="text-xs text-slate-400">→ {t.linkedProjectSlug}</span>}
            <button onClick={() => { if (i === 0) return; const n = [...tickers]; [n[i], n[i - 1]] = [n[i - 1], n[i]]; setTickers(n); }} className="rounded border border-slate-700 px-2">↑</button>
            <button onClick={() => { if (i === tickers.length - 1) return; const n = [...tickers]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; setTickers(n); }} className="rounded border border-slate-700 px-2">↓</button>
            <button onClick={() => { setTickers(tickers.filter((x) => x.id !== t.id)); toast("Removed"); }} className="rounded bg-rose-500/20 px-2 py-1 text-xs text-rose-300">Remove</button>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
