import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { Thread } from "@/routes/contact";
import {
  listMessages, updateMessageStatus, deleteMessage,
  listReasons, createReason, updateReason, deleteReason,
  type ContactMessage, type ContactReason,
} from "@/lib/cms";

export const Route = createFileRoute("/admin/contact")({ component: AdminContact });

function AdminContact() {
  const { user } = useApp();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [reasons, setReasons] = useState<ContactReason[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [m, r] = await Promise.all([listMessages(), listReasons(false)]);
      setMessages(m); setReasons(r);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load"); }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const shown = messages.filter((m) => filter === "all" || m.status === filter);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Contact & Support</h1>
          <div className="text-xs opacity-60">{messages.length} messages · {messages.filter((m) => m.status === "open").length} open</div>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as never)} className="rounded border bg-background px-2 py-1 text-xs">
          <option value="all">All</option><option value="open">Open</option><option value="closed">Closed</option>
        </select>
      </div>

      <div className="mt-5 rounded-xl border p-4">
        <div className="mb-3 text-sm font-semibold">Contact reasons</div>
        <table className="w-full text-xs">
          <thead className="opacity-60"><tr><th className="p-1 text-left">Label</th><th className="p-1">Order</th><th className="p-1">Visible</th><th className="p-1"></th></tr></thead>
          <tbody>
            {reasons.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-1"><input defaultValue={r.label} onBlur={async (e) => { if (e.target.value !== r.label) { await updateReason(r.id, { label: e.target.value }); void load(); } }} className="w-full rounded border bg-background px-2 py-1" /></td>
                <td className="p-1 text-center"><input type="number" defaultValue={r.sortOrder} onBlur={async (e) => { await updateReason(r.id, { sortOrder: parseInt(e.target.value) || 0 }); void load(); }} className="w-16 rounded border bg-background px-2 py-1 text-center" /></td>
                <td className="p-1 text-center"><input type="checkbox" checked={r.visible} onChange={async (e) => { await updateReason(r.id, { visible: e.target.checked }); void load(); }} /></td>
                <td className="p-1 text-right"><button onClick={async () => { if (confirm("Delete reason?")) { await deleteReason(r.id); void load(); } }} className="text-rose-400 hover:underline">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={async () => {
            const label = prompt("Reason label?");
            if (!label) return;
            await createReason(label, reasons.length + 1);
            void load();
          }}
          className="mt-3 rounded border px-3 py-1 text-xs"
        >+ Add reason</button>
      </div>

      <div className="mt-6 space-y-3">
        {loading && <div className="p-8 text-center text-sm opacity-60">Loading…</div>}
        {!loading && shown.length === 0 && <div className="p-8 text-center text-sm opacity-60">No messages.</div>}
        {shown.map((m) => (
          <div key={m.id}>
            {user && <Thread msg={m} userId={user.id} role="admin" />}
            <div className="mt-1 flex gap-3 pl-1 text-xs">
              <button onClick={async () => { await updateMessageStatus(m.id, m.status === "open" ? "closed" : "open"); void load(); }} className="text-sky-400 hover:underline">
                Mark {m.status === "open" ? "closed" : "open"}
              </button>
              <button onClick={async () => { if (confirm("Delete this message?")) { await deleteMessage(m.id); toast("Deleted"); void load(); } }} className="inline-flex items-center gap-1 text-rose-400 hover:underline"><Trash2 className="h-3 w-3" /> Delete</button>
              <a href={`mailto:${m.email}`} className="opacity-70 hover:underline">Email sender</a>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
