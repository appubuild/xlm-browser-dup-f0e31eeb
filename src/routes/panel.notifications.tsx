import { createFileRoute } from "@tanstack/react-router";
import { PanelShell } from "@/components/panel-shell";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/panel/notifications")({ component: PanelNotifs });

function PanelNotifs() {
  const { notifications, markAllRead } = useApp();
  return (
    <PanelShell>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <button onClick={markAllRead} className="rounded border px-3 py-1.5 text-sm hover:bg-accent">Mark all read</button>
        </div>
        <ul className="soft-card mt-6 divide-y">
          {notifications.map((n) => (
            <li key={n.id} className="flex items-center gap-3 p-4 text-sm">
              <span className={`h-2 w-2 rounded-full ${n.read ? "bg-muted" : "bg-primary"}`} />
              <div className="flex-1">{n.message}</div>
              <div className="text-xs text-muted-foreground">{new Date(n.ts).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </PanelShell>
  );
}
