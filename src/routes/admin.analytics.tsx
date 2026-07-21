import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/analytics")({ component: AdminAnalytics });

function AdminAnalytics() {
  const { projects } = useApp();
  const top = [...projects].sort((a, b) => b.visits - a.visits).slice(0, 6);
  const catCount: Record<string, number> = {};
  projects.forEach((p) => { catCount[p.category] = (catCount[p.category] ?? 0) + 1; });
  const total = Object.values(catCount).reduce((a, b) => a + b, 0);
  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <button onClick={() => toast.success("CSV export started (mock)")} className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm">Export CSV</button>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 text-sm font-medium">Top searches</div>
          <table className="w-full text-sm">
            <tbody>
              {["xaman", "nft marketplace", "xrpl explorer", "sologenic", "xrp chess", "flare bridge"].map((q, i) => (
                <tr key={q} className="border-b border-slate-800/60"><td className="py-1">{q}</td><td className="py-1 text-right text-slate-400">{600 - i * 40}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 text-sm font-medium">Category distribution</div>
          <ul className="space-y-2 text-sm">
            {Object.entries(catCount).map(([k, v]) => (
              <li key={k}>
                <div className="flex justify-between"><span className="capitalize">{k}</span><span className="text-slate-400">{Math.round((v / total) * 100)}%</span></div>
                <div className="mt-1 h-2 rounded bg-slate-800"><div className="h-full rounded bg-indigo-500" style={{ width: `${(v / total) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 text-sm font-medium">Traffic sources (mock)</div>
          <ul className="text-sm">
            <li className="flex justify-between border-b border-slate-800/60 py-1"><span>Direct</span><span className="text-slate-400">42%</span></li>
            <li className="flex justify-between border-b border-slate-800/60 py-1"><span>Search</span><span className="text-slate-400">31%</span></li>
            <li className="flex justify-between border-b border-slate-800/60 py-1"><span>Social</span><span className="text-slate-400">18%</span></li>
            <li className="flex justify-between py-1"><span>Referral</span><span className="text-slate-400">9%</span></li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 text-sm font-medium">Devices</div>
          <ul className="text-sm">
            <li className="flex justify-between border-b border-slate-800/60 py-1"><span>Desktop</span><span className="text-slate-400">61%</span></li>
            <li className="flex justify-between border-b border-slate-800/60 py-1"><span>Mobile</span><span className="text-slate-400">34%</span></li>
            <li className="flex justify-between py-1"><span>Tablet</span><span className="text-slate-400">5%</span></li>
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
          <div className="mb-2 text-sm font-medium">Top projects by visits</div>
          <ul className="space-y-2">
            {top.map((p) => (
              <li key={p.id} className="flex items-center gap-3 text-sm">
                <span className="w-40 truncate">{p.logo} {p.name}</span>
                <div className="h-2 flex-1 rounded bg-slate-800"><div className="h-full rounded bg-emerald-500" style={{ width: `${(p.visits / (top[0].visits || 1)) * 100}%` }} /></div>
                <span className="w-16 text-right text-xs text-slate-400">{p.visits.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
