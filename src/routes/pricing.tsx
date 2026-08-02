import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";
import { FounderCta, FounderBadge } from "@/components/founder-gate";
import { usePricing, useFounder, priceLabel, FOUNDER_KEY } from "@/lib/pricing";
import { fetchPromotionPackages, SLOT_LABEL, type PromotionPackage } from "@/lib/monetization";


export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing & Plans — XRPBrowser" },
      { name: "description", content: "Founder Membership, verified company badges, Pro & Enterprise plans and promotion packages for XRPL projects — all payable in XRP." },
      { property: "og:title", content: "Pricing & Plans — XRPBrowser" },
      { property: "og:description", content: "Founder Membership, verified badges, Pro & Enterprise plans and promotion packages for XRPL projects, priced in XRP." },

      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PricingPage() {
  const { user, isAdmin } = useApp();
  const { tiers, promo, loading } = usePricing();
  const { isFounder, reload } = useFounder(user?.id, isAdmin);
  const founderTier = tiers.find((t) => t.key === FOUNDER_KEY);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Pricing & Plans</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            Everything is paid on-ledger in XRP through your Xaman wallet. No cards, no subscriptions you can't cancel.
          </p>
          {isFounder && (
            <div className="mt-4 flex justify-center"><FounderBadge /></div>
          )}
        </header>

        {promo?.freeFounderClaim && !isFounder && (
          <div className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
            <p className="text-sm font-medium text-emerald-500">{promo.claimHeadline}</p>
            <div className="mx-auto mt-3 max-w-xs">
              <FounderCta tier={founderTier} promo={promo} onGranted={reload} />
            </div>
          </div>
        )}

        {loading ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">Loading plans…</p>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tiers.map((t) => (
              <div key={t.id}
                className={`soft-card flex flex-col p-5 ${t.highlight ? "border-primary shadow-lg" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">{t.name}</h2>
                  {t.highlight && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Popular</span>}
                </div>
                {t.tagline && <p className="mt-1 text-xs text-muted-foreground">{t.tagline}</p>}
                <div className="mt-4 text-2xl font-bold">{t.priceXrp} <span className="text-sm font-normal text-muted-foreground">XRP</span></div>
                <div className="text-xs text-muted-foreground">{priceLabel(t)}</div>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2"><span className="text-primary">✓</span><span>{f}</span></li>
                  ))}
                </ul>
                <div className="mt-5">
                  {t.key === FOUNDER_KEY ? (
                    isFounder ? (
                      <Link to="/panel/submit" className="block w-full rounded border px-3 py-2 text-center text-sm">
                        You're a Founder — submit a project
                      </Link>
                    ) : (
                      <FounderCta tier={t} promo={promo} onGranted={reload} compact />
                    )
                  ) : t.key === "verified_company" ? (
                    <Link to="/panel/company" className="block w-full rounded bg-primary px-3 py-2 text-center text-sm text-primary-foreground">
                      Get verified
                    </Link>
                  ) : (
                    <Link to="/contact" className="block w-full rounded border px-3 py-2 text-center text-sm">
                      Contact us
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <PromotionPackagesSection />
      </div>
    </PublicShell>
  );
}

/** Date/duration-wise promotion packages, grouped by the slot they boost. */
function PromotionPackagesSection() {
  const [pkgs, setPkgs] = useState<PromotionPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPromotionPackages()
      .then(setPkgs)
      .catch(() => setPkgs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || pkgs.length === 0) return null;

  return (
    <section className="mt-14">
      <div className="text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Promotion Packages</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          Give any of your approved projects extra visibility for a fixed number of days. Pick a package,
          then choose the project you want to promote.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pkgs.map((p) => (
          <div key={p.id} className="soft-card flex flex-col p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold">{SLOT_LABEL[p.slot]}</h3>
              <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                {p.durationDays} days
              </span>
            </div>
            <div className="mt-3 text-2xl font-bold">
              {p.priceXrp} <span className="text-sm font-normal text-muted-foreground">XRP</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {p.priceXrp} XRP / {p.durationDays} days
            </div>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm">
              <li className="flex gap-2"><span className="text-primary">✓</span><span>{SLOT_LABEL[p.slot]} placement</span></li>
              <li className="flex gap-2"><span className="text-primary">✓</span><span>Runs for {p.durationDays} days from activation</span></li>
              <li className="flex gap-2"><span className="text-primary">✓</span><span>Paid on-ledger in XRP via Xaman</span></li>
            </ul>
            <Link to="/panel/submissions"
              className="mt-5 block w-full rounded bg-primary px-3 py-2 text-center text-sm text-primary-foreground">
              Promote a project
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

