import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { login, connectWallet } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  return (
    <PublicShell>
      <div className="mx-auto max-w-sm px-6 py-16">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <form onSubmit={(e) => { e.preventDefault(); if (!email) return; login(email); toast.success("Signed in"); nav({ to: "/panel" }); }} className="mt-6 space-y-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full rounded border bg-background px-3 py-2 text-sm" />
          <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="Password" className="w-full rounded border bg-background px-3 py-2 text-sm" />
          <button className="w-full rounded bg-primary py-2 text-sm text-primary-foreground">Sign in</button>
        </form>
        <div className="my-4 text-center text-xs text-muted-foreground">OR</div>
        <button onClick={() => { connectWallet("Xaman"); login("wallet@xrpl"); toast.success("Wallet connected"); nav({ to: "/panel" }); }} className="w-full rounded border py-2 text-sm hover:bg-accent">Continue with Wallet</button>
        <div className="mt-6 text-center text-xs text-muted-foreground">No account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link></div>
      </div>
    </PublicShell>
  );
}
