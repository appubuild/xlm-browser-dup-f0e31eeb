import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const { users, updateUser, deleteUser } = useApp();
  const [q, setQ] = useState("");
  const items = users.filter((u) => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q));
  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold">Users</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users..." className="mt-4 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm" />
      <table className="mt-4 w-full text-sm">
        <thead className="border-b border-slate-800 text-left text-slate-400"><tr>
          <th className="p-2">Avatar</th><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Join Date</th><th className="p-2">Role</th><th className="p-2">Status</th><th className="p-2">Subs</th><th className="p-2">Actions</th>
        </tr></thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id} className="border-b border-slate-800/60">
              <td className="p-2 text-xl">{u.avatar}</td>
              <td className="p-2 font-medium">{u.name}</td>
              <td className="p-2 text-slate-400">{u.email}</td>
              <td className="p-2 text-slate-400">{u.joinDate}</td>
              <td className="p-2 capitalize">{u.role}</td>
              <td className="p-2"><span className={`rounded-full px-2 py-0.5 text-xs ${u.status === "active" ? "bg-green-500/20 text-green-300" : "bg-rose-500/20 text-rose-300"}`}>{u.status}</span></td>
              <td className="p-2">{u.submissionsCount}</td>
              <td className="p-2 text-xs">
                <button onClick={() => { updateUser(u.id, { status: u.status === "active" ? "suspended" : "active" }); toast(`User ${u.status === "active" ? "suspended" : "reactivated"}`); }} className="text-amber-400 hover:underline">{u.status === "active" ? "Suspend" : "Activate"}</button>
                {" · "}
                <button onClick={() => { updateUser(u.id, { role: u.role === "admin" ? "user" : "admin" }); toast("Role updated"); }} className="text-sky-400 hover:underline">{u.role === "admin" ? "Demote" : "Promote"}</button>
                {" · "}
                <button onClick={() => { if (confirm("Delete user?")) { deleteUser(u.id); toast("Deleted"); } }} className="text-rose-400 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminShell>
  );
}
