import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ types */

export type BillingPeriod = "one_time" | "duration" | "monthly";

export interface PricingTier {
  id: string;
  key: string;
  name: string;
  tagline: string | null;
  priceXrp: number;
  billingPeriod: BillingPeriod;
  durationDays: number | null;
  features: string[];
  highlight: boolean;
  sortOrder: number;
  active: boolean;
}

export interface PromoSettings {
  freeFounderClaim: boolean;
  claimStartsAt: string | null;
  claimEndsAt: string | null;
  claimHeadline: string;
}

export interface FounderMembership {
  id: string;
  userId: string;
  source: string;
  txHash: string | null;
  amountXrp: number;
  grantedAt: string;
  revoked: boolean;
}

const db = () => supabase as unknown as { from: (t: string) => any; rpc: (fn: string, args?: any) => any };
const num = (v: unknown) => Number(v ?? 0);

export const FOUNDER_KEY = "founder";

export const priceLabel = (t: PricingTier) =>
  t.billingPeriod === "monthly"
    ? `${t.priceXrp} XRP / month`
    : t.billingPeriod === "duration"
      ? `${t.priceXrp} XRP / ${t.durationDays ?? 0} days`
      : `${t.priceXrp} XRP one-time`;

const mapTier = (r: any): PricingTier => ({
  id: r.id,
  key: r.key,
  name: r.name,
  tagline: r.tagline ?? null,
  priceXrp: num(r.price_xrp),
  billingPeriod: (r.billing_period ?? "one_time") as BillingPeriod,
  durationDays: r.duration_days ?? null,
  features: Array.isArray(r.features) ? r.features : [],
  highlight: !!r.highlight,
  sortOrder: r.sort_order ?? 0,
  active: r.active !== false,
});

/* -------------------------------------------------------------- pricing */

export async function fetchPricingTiers(includeInactive = false): Promise<PricingTier[]> {
  let q = db().from("pricing_tiers").select("*").order("sort_order");
  if (!includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTier);
}

export async function savePricingTier(t: PricingTier) {
  const { error } = await db().from("pricing_tiers").update({
    name: t.name, tagline: t.tagline, price_xrp: t.priceXrp,
    billing_period: t.billingPeriod, duration_days: t.durationDays,
    features: t.features, highlight: t.highlight, sort_order: t.sortOrder, active: t.active,
  }).eq("id", t.id);
  if (error) throw new Error(error.message);
}

/* ----------------------------------------------------------- promotions */

export async function fetchPromoSettings(): Promise<PromoSettings> {
  const { data } = await db().from("promotional_settings").select("*").eq("id", 1).maybeSingle();
  return {
    freeFounderClaim: !!data?.free_founder_claim,
    claimStartsAt: data?.claim_starts_at ?? null,
    claimEndsAt: data?.claim_ends_at ?? null,
    claimHeadline: data?.claim_headline ?? "Early-bird offer: claim your Founder Membership free",
  };
}

export async function savePromoSettings(p: PromoSettings) {
  const { error } = await db().from("promotional_settings").update({
    free_founder_claim: p.freeFounderClaim,
    claim_starts_at: p.claimStartsAt,
    claim_ends_at: p.claimEndsAt,
    claim_headline: p.claimHeadline,
  }).eq("id", 1);
  if (error) throw new Error(error.message);
}

export function claimWindowOpen(p: PromoSettings | null): boolean {
  if (!p?.freeFounderClaim) return false;
  const now = Date.now();
  if (p.claimStartsAt && new Date(p.claimStartsAt).getTime() > now) return false;
  if (p.claimEndsAt && new Date(p.claimEndsAt).getTime() <= now) return false;
  return true;
}

/* -------------------------------------------------------------- founder */

export async function fetchMyFounder(userId: string): Promise<FounderMembership | null> {
  const { data } = await db().from("founder_memberships").select("*").eq("user_id", userId).maybeSingle();
  if (!data) return null;
  return {
    id: data.id, userId: data.user_id, source: data.source, txHash: data.tx_hash ?? null,
    amountXrp: num(data.amount_xrp), grantedAt: data.granted_at, revoked: !!data.revoked,
  };
}

export async function fetchFounderUserIds(): Promise<Set<string>> {
  const { data } = await db().from("founder_memberships").select("user_id,revoked");
  const s = new Set<string>();
  (data ?? []).forEach((r: any) => { if (!r.revoked) s.add(r.user_id); });
  return s;
}

export async function claimFreeFounder() {
  const { error } = await db().rpc("claim_free_founder");
  if (error) throw new Error(error.message);
}

export async function registerFounderPayment(txHash: string, amount: number, account?: string | null) {
  const { error } = await db().rpc("register_founder_payment", {
    _tx_hash: txHash, _amount: amount, _account: account ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function adminSetFounder(userId: string, enabled: boolean) {
  const { error } = await db().rpc("admin_set_founder", { _user_id: userId, _enabled: enabled });
  if (error) throw new Error(error.message);
}

export async function adminSetCompanyBadge(userId: string, tier: string | null) {
  const { error } = await db().rpc("admin_set_company_badge", { _user_id: userId, _tier: tier });
  if (error) throw new Error(error.message);
}

/* ---------------------------------------------------------------- hooks */

export function usePricing() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [promo, setPromo] = useState<PromoSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([fetchPricingTiers(), fetchPromoSettings()]);
      setTiers(t); setPromo(p);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  return { tiers, promo, loading, reload };
}

/** Founder status for the signed-in user (admins always count as founders). */
export function useFounder(userId: string | null | undefined, isAdmin = false) {
  const [membership, setMembership] = useState<FounderMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setMembership(null); setLoading(false); return; }
    setLoading(true);
    try { setMembership(await fetchMyFounder(userId)); }
    catch { setMembership(null); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { void reload(); }, [reload]);

  const isFounder = isAdmin || (!!membership && !membership.revoked);
  return { membership, isFounder, loading, reload };
}

/** Change a user's app role. The DB function blocks admins from changing their own role. */
export async function adminSetUserRole(userId: string, role: "user" | "moderator" | "admin" | "founder") {
  const { error } = await db().rpc("admin_set_user_role" as never, { _user_id: userId, _role: role } as never);
  if (error) throw new Error(error.message);
}
