import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { signInEmail, signInGoogle, signInApple, session, loading: authLoading, isAdmin, siteSettings } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in → never show the sign-in form.
  useEffect(() => {
    if (!authLoading && session) nav({ to: isAdmin ? "/admin" : "/panel", replace: true });
  }, [authLoading, session, isAdmin, nav]);

  if (authLoading || session) {
    return (
      <PublicShell>
        <div className="grid place-items-center py-24 text-sm text-muted-foreground">Redirecting…</div>
      </PublicShell>
    );
  }


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) return;
    setLoading(true);
    const { error } = await signInEmail(email, pw);
    setLoading(false);
    if (error) { toast.error(error); return; }
    toast.success("Signed in");
    nav({ to: "/panel" });
  };

  return (
    <PublicShell>
      <div className="mx-auto max-w-sm px-6 py-16">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full rounded border bg-background px-3 py-2 text-sm" required />
          <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="Password" className="w-full rounded border bg-background px-3 py-2 text-sm" required />
          <button disabled={loading} className="w-full rounded bg-primary py-2 text-sm text-primary-foreground disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        {(siteSettings.enableGoogleLogin || siteSettings.enableAppleLogin) && (
          <>
        <div className="my-4 text-center text-xs text-muted-foreground">OR</div>
        <div className="space-y-2">
          {siteSettings.enableGoogleLogin && <button onClick={() => { void signInGoogle().catch((e) => toast.error(e instanceof Error ? e.message : "Google sign-in failed")); }} className="w-full rounded border py-2 text-sm hover:bg-accent">Continue with Google</button>}
          {siteSettings.enableAppleLogin && <button onClick={() => { void signInApple().catch((e) => toast.error(e instanceof Error ? e.message : "Apple sign-in failed")); }} className="w-full rounded border py-2 text-sm hover:bg-accent"> Continue with Apple</button>}
        </div>
          </>
        )}
        <div className="mt-6 text-center text-xs text-muted-foreground">No account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link></div>
      </div>
    </PublicShell>
  );
}
