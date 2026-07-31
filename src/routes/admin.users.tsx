import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import { adminSetCompanyBadge, adminSetFounder, fetchFounderUserIds } from "@/lib/pricing";
import { fetchAllAuthorProfiles, fetchBadgeTiers, type AuthorProfile, type BadgeTier } from "@/lib/monetization";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const { users, updateUser, deleteUser } = useApp();
  const [q, setQ] = useState("");
  const [founders, setFounders] = useState<Set<string>>(new Set());
  const [profiles, setProfiles] = useState<AuthorProfile[]>([]);
  const [tiers, setTiers] = useState<BadgeTier[]>([]);

  const load = useCallback(async () => {
    try {
      const [f, p, t] = await Promise.all([fetchFounderUserIds(), fetchAllAuthorProfiles(), fetchBadgeTiers(true)]);
      setFounders(f); setProfiles(p); setTiers(t);
    } catch { /* non-admins never reach this page */ }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const badgeOf = (uid: string) => profiles.find((p) => p.userId === uid)?.badgeTier ?? "";

  const toggleFounder = async (uid: string, on: boolean) => {
    try { await adminSetFounder(uid, on); toast.success(on ? "Founder granted" : "Founder revoked"); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const setBadge = async (uid: string, tier: string) => {
    try { await adminSetCompanyBadge(uid, tier || null); toast.success("Badge updated"); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const items = users.filter((u) => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q));
  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold">Users</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users..." className="mt-4 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm" />
      <div className="overflow-x-auto">
      <table className="mt-4 w-full min-w-[900px] text-sm">
        <thead className="border-b border-slate-800 text-left text-slate-400"><tr>
          <th className="p-2">Avatar</th><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Join Date</th><th className="p-2">Role</th><th className="p-2">Founder</th><th className="p-2">Company badge</th><th className="p-2">Status</th><th className="p-2">Actions</th>
        </tr></thead>
        <tbody>
          {items.map((u) => {
            const isFounder = founders.has(u.id);
            const hasProfile = profiles.some((p) => p.userId === u.id);
            return (
              <tr key={u.id} className="border-b border-slate-800/60">
                <td className="p-2 text-xl">{u.avatar}</td>
                <td className="p-2 font-medium">{u.name}</td>
                <td className="p-2 text-slate-400">{u.email}</td>
                <td className="p-2 text-slate-400">{u.joinDate}</td>
                <td className="p-2 capitalize">{u.role}</td>
                <td className="p-2">
                  <button onClick={() => toggleFounder(u.id, !isFounder)}
                    className={`rounded-full px-2 py-0.5 text-xs ${isFounder ? "bg-amber-400/20 text-amber-300" : "bg-slate-800 text-slate-400"}`}>
                    {isFounder ? "★ Founder" : "Grant"}
                  </button>
                </td>
                <td className="p-2">
                  <select value={badgeOf(u.id)} disabled={!hasProfile}
                    onChange={(e) => setBadge(u.id, e.target.value)}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs disabled:opacity-40">
                    <option value="">{hasProfile ? "None" : "No company"}</option>
                    {tiers.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                  </select>
                </td>
                <td className="p-2"><span className={`rounded-full px-2 py-0.5 text-xs ${u.status === "active" ? "bg-green-500/20 text-green-300" : "bg-rose-500/20 text-rose-300"}`}>{u.status}</span></td>
                <td className="p-2 text-xs">
                  <button onClick={() => { updateUser(u.id, { status: u.status === "active" ? "suspended" : "active" }); toast(`User ${u.status === "active" ? "suspended" : "reactivated"}`); }} className="text-amber-400 hover:underline">{u.status === "active" ? "Suspend" : "Activate"}</button>
                  {" · "}
                  <button onClick={() => { updateUser(u.id, { role: u.role === "admin" ? "user" : "admin" }); toast("Role updated"); }} className="text-sky-400 hover:underline">{u.role === "admin" ? "Demote" : "Promote"}</button>
                  {" · "}
                  <button onClick={() => { if (confirm("Delete user?")) { deleteUser(u.id); toast("Deleted"); } }} className="text-rose-400 hover:underline">Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </AdminShell>
  );
}
