import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ types */

export type SocialLink = { platform: string; url: string };

export interface AuthorProfile {
  id: string;
  userId: string;
  companyName: string;
  slug: string | null;
  logo: string | null;
  bio: string | null;
  officialEmail: string | null;
  website: string | null;
  socials: SocialLink[];
  badgeTier: string | null;
  badgeSince: string | null;
  verified: boolean;
  featured: boolean;
  createdAt: string;
}

export interface BadgeTier {
  id: string;
  key: string;
  name: string;
  priceXrp: number;
  color: string;
  benefits: string[];
  sortOrder: number;
  active: boolean;
}

export type PromoSlot = "home" | "trending" | "popular";

export const SLOT_LABEL: Record<PromoSlot, string> = {
  home: "Homepage Feature",
  trending: "Trending Section",
  popular: "Popular Section",
};

export interface PromotionPackage {
  id: string;
  slot: PromoSlot;
  durationDays: number;
  priceXrp: number;
  active: boolean;
  sortOrder: number;
}

export type PayStatus = "pending" | "active" | "success" | "failed" | "expired" | "revoked";

export interface ProjectPromotion {
  id: string;
  projectSlug: string;
  userId: string;
  slot: PromoSlot;
  durationDays: number;
  amountXrp: number;
  txHash: string | null;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export interface BadgePurchase {
  id: string;
  userId: string;
  tierKey: string;
  amountXrp: number;
  txHash: string | null;
  status: string;
  createdAt: string;
}

export interface TxRecord {
  id: string;
  userId: string;
  kind: string;
  description: string | null;
  referenceId: string | null;
  amountXrp: number;
  txHash: string | null;
  account: string | null;
  status: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ maps */

const db = () => supabase as unknown as {
  from: (t: string) => any;
};

const num = (v: unknown) => Number(v ?? 0);

export const mapProfile = (r: any): AuthorProfile => ({
  id: r.id,
  userId: r.user_id,
  companyName: r.company_name,
  slug: r.slug ?? null,
  logo: r.logo ?? null,
  bio: r.bio ?? null,
  officialEmail: r.official_email ?? null,
  website: r.website ?? null,
  socials: Array.isArray(r.socials) ? (r.socials as SocialLink[]) : [],
  badgeTier: r.badge_tier ?? null,
  badgeSince: r.badge_since ?? null,
  verified: !!r.verified,
  featured: !!r.featured,
  createdAt: r.created_at ?? new Date().toISOString(),
});

const mapTier = (r: any): BadgeTier => ({
  id: r.id, key: r.key, name: r.name, priceXrp: num(r.price_xrp), color: r.color ?? "sky",
  benefits: r.benefits ?? [], sortOrder: r.sort_order ?? 0, active: r.active !== false,
});

const mapPkg = (r: any): PromotionPackage => ({
  id: r.id, slot: r.slot as PromoSlot, durationDays: r.duration_days,
  priceXrp: num(r.price_xrp), active: r.active !== false, sortOrder: r.sort_order ?? 0,
});

const mapPromo = (r: any): ProjectPromotion => ({
  id: r.id, projectSlug: r.project_slug, userId: r.user_id, slot: r.slot as PromoSlot,
  durationDays: r.duration_days, amountXrp: num(r.amount_xrp), txHash: r.tx_hash ?? null,
  status: r.status, startsAt: r.starts_at ?? null, endsAt: r.ends_at ?? null, createdAt: r.created_at,
});

const mapBadgeBuy = (r: any): BadgePurchase => ({
  id: r.id, userId: r.user_id, tierKey: r.tier_key, amountXrp: num(r.amount_xrp),
  txHash: r.tx_hash ?? null, status: r.status, createdAt: r.created_at,
});

const mapTx = (r: any): TxRecord => ({
  id: r.id, userId: r.user_id, kind: r.kind, description: r.description ?? null,
  referenceId: r.reference_id ?? null, amountXrp: num(r.amount_xrp), txHash: r.tx_hash ?? null,
  account: r.account ?? null, status: r.status, createdAt: r.created_at,
});

/* ------------------------------------------------------------- pricing */

export async function fetchBadgeTiers(includeInactive = false): Promise<BadgeTier[]> {
  let q = db().from("badge_tiers").select("*").order("sort_order");
  if (!includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTier);
}

export async function saveBadgeTier(t: Partial<BadgeTier> & { id: string }) {
  const { error } = await db().from("badge_tiers").update({
    name: t.name, price_xrp: t.priceXrp, color: t.color, benefits: t.benefits,
    sort_order: t.sortOrder, active: t.active,
  }).eq("id", t.id);
  if (error) throw new Error(error.message);
}

export async function createBadgeTier(t: Omit<BadgeTier, "id">) {
  const { error } = await db().from("badge_tiers").insert({
    key: t.key, name: t.name, price_xrp: t.priceXrp, color: t.color,
    benefits: t.benefits, sort_order: t.sortOrder, active: t.active,
  });
  if (error) throw new Error(error.message);
}

export async function deleteBadgeTier(id: string) {
  const { error } = await db().from("badge_tiers").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function fetchPromotionPackages(includeInactive = false): Promise<PromotionPackage[]> {
  let q = db().from("promotion_packages").select("*").order("sort_order");
  if (!includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPkg);
}

export async function savePromotionPackage(p: Partial<PromotionPackage> & { id: string }) {
  const { error } = await db().from("promotion_packages").update({
    slot: p.slot, duration_days: p.durationDays, price_xrp: p.priceXrp,
    active: p.active, sort_order: p.sortOrder,
  }).eq("id", p.id);
  if (error) throw new Error(error.message);
}

export async function createPromotionPackage(p: Omit<PromotionPackage, "id">) {
  const { error } = await db().from("promotion_packages").insert({
    slot: p.slot, duration_days: p.durationDays, price_xrp: p.priceXrp,
    active: p.active, sort_order: p.sortOrder,
  });
  if (error) throw new Error(error.message);
}

export async function deletePromotionPackage(id: string) {
  const { error } = await db().from("promotion_packages").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------- author profile */

export async function fetchMyAuthorProfile(userId: string): Promise<AuthorProfile | null> {
  const { data, error } = await db().from("author_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProfile(data) : null;
}

export async function fetchAllAuthorProfiles(): Promise<AuthorProfile[]> {
  const { data, error } = await db().from("author_profiles").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProfile);
}

/** Public: verified companies chosen by an admin for the landing page. */
export async function fetchFeaturedCompanies(limit = 6): Promise<AuthorProfile[]> {
  const { data, error } = await db().from("author_profiles")
    .select("*").eq("featured", true).eq("verified", true)
    .order("badge_since", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProfile);
}

export async function setCompanyFeatured(id: string, featured: boolean) {
  const { error } = await db().from("author_profiles").update({ featured }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Public: one company by profile id, slug, or owner id. */
export async function fetchCompanyProfile(key: string): Promise<AuthorProfile | null> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(key);
  const filter = isUuid ? `id.eq.${key},user_id.eq.${key}` : `slug.eq.${key}`;
  const { data, error } = await db().from("author_profiles").select("*").or(filter).limit(1);
  if (error) throw new Error(error.message);
  return data && data[0] ? mapProfile(data[0]) : null;
}

export async function fetchCompanyByOwner(userId: string): Promise<AuthorProfile | null> {
  const { data, error } = await db().from("author_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProfile(data) : null;
}

export type DuplicateField = "name" | "email";

/** Returns which unique field is already taken by *another* company, if any. */
export async function findCompanyConflict(
  userId: string, companyName: string, officialEmail: string,
): Promise<DuplicateField | null> {
  const { data, error } = await db().from("author_profiles").select("user_id, company_name, official_email");
  if (error) throw new Error(error.message);
  const name = companyName.trim().toLowerCase();
  const email = officialEmail.trim().toLowerCase();
  for (const r of data ?? []) {
    if (r.user_id === userId) continue;
    if (name && (r.company_name ?? "").trim().toLowerCase() === name) return "name";
    if (email && (r.official_email ?? "").trim().toLowerCase() === email) return "email";
  }
  return null;
}

export async function upsertAuthorProfile(userId: string, p: Partial<AuthorProfile>): Promise<AuthorProfile> {
  const row = {
    user_id: userId,
    company_name: p.companyName ?? "",
    slug: p.slug || null,
    logo: p.logo || null,
    bio: p.bio || null,
    official_email: p.officialEmail || null,
    website: p.website || null,
    socials: p.socials ?? [],
  };
  const { data, error } = await db().from("author_profiles").upsert(row, { onConflict: "user_id" }).select("*").single();
  if (error) throw new Error(error.message);
  return mapProfile(data);
}

/* ------------------------------------------------------------ payments */

export async function logTransaction(input: {
  userId: string; kind: string; description?: string; referenceId?: string;
  amountXrp: number; txHash?: string | null; account?: string | null; status: string;
}) {
  const { error } = await db().from("transactions").insert({
    user_id: input.userId, kind: input.kind, description: input.description ?? null,
    reference_id: input.referenceId ?? null, amount_xrp: input.amountXrp,
    tx_hash: input.txHash ?? null, account: input.account ?? null, status: input.status,
  });
  if (error) throw new Error(error.message);
}

export async function fetchMyTransactions(userId: string): Promise<TxRecord[]> {
  const { data, error } = await db().from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTx);
}

export async function fetchAllTransactions(): Promise<TxRecord[]> {
  const { data, error } = await db().from("transactions").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTx);
}

/** Records a lifetime badge purchase and immediately grants it (tx hash verified on-ledger by Xaman). */
export async function purchaseBadge(userId: string, tier: BadgeTier, txHash: string, account?: string | null) {
  const { error } = await db().from("badge_purchases").insert({
    user_id: userId, tier_key: tier.key, amount_xrp: tier.priceXrp, tx_hash: txHash, status: "success",
  });
  if (error) throw new Error(error.message);
  const { error: e2 } = await db().from("author_profiles")
    .update({ badge_tier: tier.key, badge_since: new Date().toISOString(), verified: true })
    .eq("user_id", userId);
  if (e2) throw new Error(e2.message);
  await logTransaction({
    userId, kind: "badge", description: `${tier.name} lifetime badge`, referenceId: tier.key,
    amountXrp: tier.priceXrp, txHash, account, status: "success",
  });
}

export async function fetchMyBadgePurchases(userId: string): Promise<BadgePurchase[]> {
  const { data, error } = await db().from("badge_purchases").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapBadgeBuy);
}

export async function fetchAllBadgePurchases(): Promise<BadgePurchase[]> {
  const { data, error } = await db().from("badge_purchases").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapBadgeBuy);
}

/** Creates a promotion after payment. Auto-activates when a valid tx hash exists. */
export async function createPromotion(input: {
  userId: string; projectSlug: string; projectName: string; pkg: PromotionPackage;
  txHash: string | null; account?: string | null; autoVerify: boolean;
}) {
  const now = new Date();
  const ends = new Date(now.getTime() + input.pkg.durationDays * 86400000);
  const active = input.autoVerify && !!input.txHash;
  const { error } = await db().from("project_promotions").insert({
    project_slug: input.projectSlug,
    user_id: input.userId,
    slot: input.pkg.slot,
    duration_days: input.pkg.durationDays,
    amount_xrp: input.pkg.priceXrp,
    tx_hash: input.txHash,
    status: active ? "active" : "pending",
    starts_at: active ? now.toISOString() : null,
    ends_at: active ? ends.toISOString() : null,
  });
  if (error) throw new Error(error.message);
  await logTransaction({
    userId: input.userId, kind: "promotion",
    description: `${SLOT_LABEL[input.pkg.slot]} — ${input.projectName} (${input.pkg.durationDays} days)`,
    referenceId: input.projectSlug, amountXrp: input.pkg.priceXrp,
    txHash: input.txHash, account: input.account, status: "success",
  });
}

export async function fetchMyPromotions(userId: string): Promise<ProjectPromotion[]> {
  const { data, error } = await db().from("project_promotions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPromo);
}

export async function fetchAllPromotions(): Promise<ProjectPromotion[]> {
  const { data, error } = await db().from("project_promotions").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPromo);
}

/** Public: currently running promotions, used by the homepage to place projects. */
export async function fetchActivePromotions(): Promise<ProjectPromotion[]> {
  const { data, error } = await db().from("project_promotions").select("*")
    .eq("status", "active").order("created_at", { ascending: false });
  if (error) return [];
  const now = Date.now();
  const rows: ProjectPromotion[] = (data ?? []).map(mapPromo);
  return rows.filter((p) => !p.endsAt || new Date(p.endsAt).getTime() > now);
}

export async function setPromotionStatus(id: string, status: string, extraDays = 0) {
  const patch: Record<string, unknown> = { status };
  if (status === "active") {
    const { data } = await db().from("project_promotions").select("duration_days, starts_at").eq("id", id).maybeSingle();
    const days = (data?.duration_days ?? 7) + extraDays;
    const start = new Date();
    patch.starts_at = start.toISOString();
    patch.ends_at = new Date(start.getTime() + days * 86400000).toISOString();
  }
  const { error } = await db().from("project_promotions").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function extendPromotion(id: string, days: number) {
  const { data, error } = await db().from("project_promotions").select("ends_at").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  const base = data?.ends_at ? new Date(data.ends_at) : new Date();
  const next = new Date(Math.max(base.getTime(), Date.now()) + days * 86400000);
  const { error: e2 } = await db().from("project_promotions").update({ ends_at: next.toISOString(), status: "active" }).eq("id", id);
  if (e2) throw new Error(e2.message);
}

export async function setAuthorBadge(userId: string, tierKey: string | null) {
  const { error } = await db().from("author_profiles").update({
    badge_tier: tierKey,
    badge_since: tierKey ? new Date().toISOString() : null,
    verified: !!tierKey,
  }).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

/** Admin: flip a company's verified flag without touching its paid badge tier. */
export async function setAuthorVerified(id: string, verified: boolean) {
  const { error } = await db().from("author_profiles").update({ verified }).eq("id", id);
  if (error) throw new Error(error.message);
}
