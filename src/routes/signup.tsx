import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const { login } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  return (
    <PublicShell>
      <div className="mx-auto max-w-sm px-6 py-16">
        <h1 className="text-2xl font-bold">Create account</h1>
        <form onSubmit={(e) => { e.preventDefault(); if (!email) return; login(email); toast.success("Welcome to XRPBrowser"); nav({ to: "/panel" }); }} className="mt-6 space-y-3">
          <input placeholder="Display name" className="w-full rounded border bg-background px-3 py-2 text-sm" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full rounded border bg-background px-3 py-2 text-sm" />
          <input type="password" placeholder="Password" className="w-full rounded border bg-background px-3 py-2 text-sm" />
          <button className="w-full rounded bg-primary py-2 text-sm text-primary-foreground">Create account</button>
        </form>
        <div className="mt-6 text-center text-xs text-muted-foreground">Have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></div>
      </div>
    </PublicShell>
  );
}
