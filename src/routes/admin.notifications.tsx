import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/notifications")({ component: AdminNotifs });

function AdminNotifs() {
  const { notifications, pushNotification } = useApp();
  const [msg, setMsg] = useState("");
  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="text-sm font-medium">Compose platform notification</div>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Write a message..." className="mt-2 min-h-20 w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm" />
        <button onClick={() => { if (!msg) return; pushNotification(msg); setMsg(""); toast.success("Sent to all users"); }} className="mt-2 rounded bg-sky-500 px-3 py-1.5 text-sm text-white">Send</button>
      </div>
      <div className="mt-6">
        <div className="mb-2 text-sm font-medium">Recent</div>
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
              <div>{n.message}</div>
              <div className="text-xs text-slate-400">{new Date(n.ts).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
