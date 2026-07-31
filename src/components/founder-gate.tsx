import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useApp } from "@/lib/app-store";
import { XamanPayDialog } from "@/components/xaman-pay-dialog";
import {
  claimFreeFounder, claimWindowOpen, registerFounderPayment,
  type PricingTier, type PromoSettings,
} from "@/lib/pricing";

/**
 * Founder Membership call-to-action.
 * Shows the free claim button while the promo window is open, otherwise the
 * 2 XRP (admin-configurable) Xaman checkout.
 */
export function FounderCta({
  tier, promo, onGranted, compact,
}: {
  tier: PricingTier | undefined;
  promo: PromoSettings | null;
  onGranted: () => void | Promise<void>;
  compact?: boolean;
}) {
  const { user } = useApp();
  const [pay, setPay] = useState(false);
  const [busy, setBusy] = useState(false);
  const price = tier?.priceXrp ?? 2;
  const free = claimWindowOpen(promo);

  if (!user) {
    return (
      <Link to="/login" className="block w-full rounded bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
        Sign in to become a Founder
      </Link>
    );
  }

  const claim = async () => {
    setBusy(true);
    try {
      await claimFreeFounder();
      toast.success("Founder Membership unlocked 🎉");
      await onGranted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not claim the offer");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-2">
      {free ? (
        <>
          <button onClick={claim} disabled={busy}
            className="w-full rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
            {busy ? "Unlocking…" : "Claim Free Founder Membership"}
          </button>
          {!compact && promo?.claimEndsAt && (
            <p className="text-center text-xs text-muted-foreground">
              Offer ends {new Date(promo.claimEndsAt).toLocaleString()}
            </p>
          )}
        </>
      ) : (
        <button onClick={() => setPay(true)}
          className="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Become a Founder — {price} XRP
        </button>
      )}

      <XamanPayDialog
        open={pay}
        title="Founder Membership"
        subtitle="One-time payment. Founder status is permanent."
        amountXrp={price}
        memo="XRPBrowser Founder Membership"
        onClose={() => setPay(false)}
        onPaid={async (txHash, account) => {
          try {
            await registerFounderPayment(txHash, price, account);
            toast.success("Payment confirmed — you are a Founder 🎉");
            setPay(false);
            await onGranted();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not record the payment");
          }
        }}
      />
    </div>
  );
}

export function FounderBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-500 ${className}`}>
      ★ Founder
    </span>
  );
}
