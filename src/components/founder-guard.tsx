import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useApp } from "@/lib/app-store";
import { usePricing, useFounder, FOUNDER_KEY } from "@/lib/pricing";
import { FounderCta } from "@/components/founder-gate";

/**
 * Gates Founder-only surfaces (Company Profile, Analytics dashboards).
 * Standard users get an inline "Upgrade to Founder" paywall instead.
 */
export function FounderGuard({ feature, children }: { feature: string; children: ReactNode }) {
  const { user, isAdmin } = useApp();
  const { tiers, promo } = usePricing();
  const { isFounder, loading, reload } = useFounder(user?.id, isAdmin);

  if (!user) {
    return (
      <Paywall title="Sign in required" body={`Sign in to access ${feature}.`}>
        <Link to="/login" className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Go to sign in</Link>
      </Paywall>
    );
  }
  if (loading) return <div className="p-10 text-center text-sm text-muted-foreground">Checking your membership…</div>;
  if (isFounder) return <>{children}</>;

  return (
    <Paywall
      title="Upgrade to Founder"
      body={`${feature} is available to Founder Members. Unlock it with a one-time payment — or claim it free while the promo is running.`}
    >
      <div className="w-full max-w-xs">
        <FounderCta tier={tiers.find((t) => t.key === FOUNDER_KEY)} promo={promo} onGranted={reload} compact />
        <Link to="/pricing" className="mt-3 block text-center text-xs text-primary hover:underline">See all plans →</Link>
      </div>
    </Paywall>
  );
}

function Paywall({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-lg p-8">
      <div className="soft-card flex flex-col items-center gap-3 p-8 text-center">
        <div className="text-3xl">★</div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{body}</p>
        {children}
      </div>
    </div>
  );
}
