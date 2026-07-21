import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/projects/pending")({ component: Moderation });

function Moderation() {
  const { projects, updateProject, autoApprove, setAutoApprove } = useApp();
  const pending = projects.filter((p) => p.status === "pending");
  const [reject, setReject] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Moderation Queue</h1>
        <label className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm">
          <input type="checkbox" checked={autoApprove} onChange={(e) => { setAutoApprove(e.target.checked); toast(`Auto-approve ${e.target.checked ? "enabled" : "disabled"}`); }} />
          Auto-Approve New Submissions
        </label>
      </div>
      {pending.length === 0 && <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">No pending submissions.</div>}
      <div className="mt-4 space-y-3">
        {pending.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-start gap-4">
              <div className="text-3xl">{p.logo}</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{p.name} <span className="ml-1 rounded bg-slate-800 px-2 py-0.5 text-xs capitalize">{p.category}</span></div>
                <div className="text-xs text-slate-400">{p.url}</div>
                <p className="mt-1 text-sm text-slate-300">{p.tagline}</p>
                <p className="mt-1 text-xs text-slate-500">Submitted by {p.submitterName} · {p.submitterEmail}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => { updateProject(p.id, { status: "approved" }); toast.success(`Approved ${p.name}`); }} className="rounded bg-green-500/20 px-3 py-1.5 text-xs text-green-300">✅ Approve</button>
                <button onClick={() => setReject(p.id)} className="rounded bg-rose-500/20 px-3 py-1.5 text-xs text-rose-300">❌ Reject</button>
                <button onClick={() => toast("Change request sent")} className="rounded bg-slate-800 px-3 py-1.5 text-xs">✏️ Request changes</button>
              </div>
            </div>
            {reject === p.id && (
              <div className="mt-3 rounded border border-rose-500/30 bg-rose-500/5 p-3">
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection..." className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm" />
                <div className="mt-2 flex gap-2">
                  <button onClick={() => { updateProject(p.id, { status: "rejected" }); toast("Rejected"); setReject(null); setReason(""); }} className="rounded bg-rose-500 px-3 py-1 text-xs text-white">Confirm</button>
                  <button onClick={() => setReject(null)} className="rounded border border-slate-700 px-3 py-1 text-xs">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
