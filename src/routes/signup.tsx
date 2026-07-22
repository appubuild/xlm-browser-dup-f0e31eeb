import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const { signUpEmail, signInGoogle } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) return;
    setLoading(true);
    const { error } = await signUpEmail(email, pw, name);
    setLoading(false);
    if (error) { toast.error(error); return; }
    toast.success("Account created — check your inbox to confirm, then sign in.");
    nav({ to: "/login" });
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-sm px-6 py-16">
        <h1 className="text-2xl font-bold">Create account</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="w-full rounded border bg-background px-3 py-2 text-sm" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full rounded border bg-background px-3 py-2 text-sm" required />
          <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="Password (min 6 chars)" minLength={6} className="w-full rounded border bg-background px-3 py-2 text-sm" required />
          <button disabled={loading} className="w-full rounded bg-primary py-2 text-sm text-primary-foreground disabled:opacity-50">{loading ? "Creating…" : "Create account"}</button>
        </form>
        <div className="my-4 text-center text-xs text-muted-foreground">OR</div>
        <button onClick={() => signInGoogle()} className="w-full rounded border py-2 text-sm hover:bg-accent">Continue with Google</button>
        <div className="mt-6 text-center text-xs text-muted-foreground">Have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></div>
      </div>
    </PublicShell>
  );
}
