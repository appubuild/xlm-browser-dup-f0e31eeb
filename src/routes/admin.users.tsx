import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { UserAvatar } from "@/components/user-avatar";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import { adminSetCompanyBadge, adminSetFounder, adminSetUserRole, fetchFounderUserIds } from "@/lib/pricing";
import { fetchAllAuthorProfiles, fetchBadgeTiers, type AuthorProfile, type BadgeTier } from "@/lib/monetization";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

const inp = "rounded border border-current/25 bg-transparent px-2 py-1 text-xs";

function AdminUsers() {
  const { users, updateUser, deleteUser, user: me } = useApp();
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

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.success(msg); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const items = users.filter((u) => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q));

  return (
    <AdminShell>
      <h1 className="text-xl font-semibold sm:text-2xl">Users</h1>
      <p className="text-sm opacity-70">Manage roles, Founder access and company badges. You cannot change your own admin role.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users..."
        className="mt-4 w-full max-w-xs rounded border border-current/25 bg-transparent px-3 py-1.5 text-sm" />
      <div className="-mx-4 mt-4 overflow-x-auto px-4">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-current/15 text-left text-xs opacity-70"><tr>
            <th className="p-2">User</th><th className="p-2">Email</th><th className="p-2">Joined</th>
            <th className="p-2">Role</th><th className="p-2">Founder</th><th className="p-2">Company badge</th>
            <th className="p-2">Status</th><th className="p-2">Actions</th>
          </tr></thead>
          <tbody>
            {items.map((u) => {
              const isFounder = founders.has(u.id);
              const hasProfile = profiles.some((p) => p.userId === u.id);
              const isSelf = me?.id === u.id;
              return (
                <tr key={u.id} className="border-b border-current/10">
                  <td className="p-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <UserAvatar avatar={u.avatar} name={u.name} size={28} />
                      <span className="truncate font-medium">{u.name}{isSelf && <span className="ml-1 text-[10px] opacity-60">(you)</span>}</span>
                    </span>
                  </td>
                  <td className="p-2 text-xs opacity-70">{u.email}</td>
                  <td className="p-2 text-xs opacity-70">{u.joinDate}</td>
                  <td className="p-2">
                    <select
                      value={u.role}
                      disabled={isSelf}
                      title={isSelf ? "You cannot change your own role" : undefined}
                      onChange={(e) => {
                        const next = e.target.value as "user" | "moderator" | "admin";
                        void act(async () => {
                          if (u.role !== "user") await adminSetUserRole(u.id, u.role as "moderator" | "admin", false);
                          if (next !== "user") await adminSetUserRole(u.id, next, true);
                          else await adminSetUserRole(u.id, "user", true);
                          updateUser(u.id, { role: next });
                        }, "Role updated");
                      }}
                      className={`${inp} w-32 disabled:opacity-40`}
                    >
                      <option value="user">Standard user</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button onClick={() => act(() => adminSetFounder(u.id, !isFounder), isFounder ? "Founder revoked" : "Founder granted")}
                      className={`rounded-full px-2 py-0.5 text-xs ${isFounder ? "bg-amber-400/20 text-amber-400" : "border border-current/25 opacity-70"}`}>
                      {isFounder ? "★ Founder" : "Grant Founder"}
                    </button>
                  </td>
                  <td className="p-2">
                    <select value={badgeOf(u.id)} disabled={!hasProfile}
                      onChange={(e) => act(() => adminSetCompanyBadge(u.id, e.target.value || null), "Badge updated")}
                      className={`${inp} w-36 disabled:opacity-40`}>
                      <option value="">{hasProfile ? "None" : "No company"}</option>
                      {tiers.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                    </select>
                  </td>
                  <td className="p-2"><span className={`rounded-full px-2 py-0.5 text-xs ${u.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>{u.status}</span></td>
                  <td className="p-2 whitespace-nowrap text-xs">
                    <button disabled={isSelf}
                      onClick={() => { updateUser(u.id, { status: u.status === "active" ? "suspended" : "active" }); toast(`User ${u.status === "active" ? "suspended" : "reactivated"}`); }}
                      className="text-amber-400 hover:underline disabled:opacity-40 disabled:no-underline">{u.status === "active" ? "Suspend" : "Activate"}</button>
                    {" · "}
                    <button disabled={isSelf}
                      onClick={() => { if (confirm("Delete user?")) { deleteUser(u.id); toast("Deleted"); } }}
                      className="text-rose-400 hover:underline disabled:opacity-40 disabled:no-underline">Delete</button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-sm opacity-60">No users found.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
