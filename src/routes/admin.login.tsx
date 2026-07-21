import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({ component: AdminLogin });

function AdminLogin() {
  const { adminLogin } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@xrpbrowser.com");
  const [pw, setPw] = useState("admin");
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <form onSubmit={(e) => { e.preventDefault(); adminLogin(); toast.success("Admin signed in"); nav({ to: "/admin" }); }} className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-lg font-semibold">Admin sign-in</h1>
        <p className="mt-1 text-xs text-slate-400">Mock credentials pre-filled.</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-4 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
        <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" className="mt-2 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
        <button className="mt-4 w-full rounded-md bg-sky-500 py-2 text-sm font-medium text-white hover:bg-sky-400">Sign in</button>
      </form>
    </div>
  );
}
