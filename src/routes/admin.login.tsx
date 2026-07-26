import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/admin/login")({ component: AdminLogin });

function AdminLogin() {
  const { session, isAdmin, loading } = useApp();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) nav({ to: "/login", replace: true });
    else if (isAdmin) nav({ to: "/admin", replace: true });
  }, [loading, session, isAdmin, nav]);

  if (loading || !session || isAdmin) {
    return <div className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-400">Checking access…</div>;
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
        <h1 className="text-lg font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-slate-400">Your account does not have admin permissions.</p>
        <button onClick={() => nav({ to: "/" })} className="mt-4 w-full rounded-md bg-sky-500 py-2 text-sm font-medium text-white hover:bg-sky-400">
          Back to site
        </button>
      </div>
    </div>
  );
}
