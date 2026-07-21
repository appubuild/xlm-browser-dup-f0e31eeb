import { createFileRoute, Link } from "@tanstack/react-router";
import { PanelShell } from "@/components/panel-shell";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/panel/submissions")({ component: Submissions });

function Submissions() {
  const { user, projects } = useApp();
  const mine = projects.filter((p) => p.submitterEmail === user?.email);
  return (
    <PanelShell>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Submissions</h1>
          <Link to="/submit" className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground">+ Submit new</Link>
        </div>
        {mine.length === 0 ? (
          <div className="soft-card mt-6 p-10 text-center text-muted-foreground">You haven't submitted any projects yet.</div>
        ) : (
          <table className="soft-card mt-6 w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr><th className="p-3">Project</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {mine.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{p.logo} {p.name}</td>
                  <td className="p-3 capitalize">{p.category}</td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
                  <td className="p-3 text-muted-foreground">{p.dateAdded}</td>
                  <td className="p-3">{p.status === "rejected" && <Link to="/submit" className="text-primary hover:underline">Edit &amp; Resubmit</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PanelShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { approved: "bg-success/20 text-success", pending: "bg-warning/20 text-warning", rejected: "bg-destructive/20 text-destructive" };
  return <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${map[status]}`}>{status}</span>;
}
