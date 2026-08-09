/**
 * Paid feature grants. Each function verifies the Stellar transaction on
 * Horizon (destination, native asset, amount, hash reuse) before writing.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const hash = z.string().min(10);

export const verifyListingPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ projectId: z.string().uuid(), txHash: hash, account: z.string().nullish() }).parse(d))
  .handler(async ({ data, context }) => {
    const { verifyPayment, logTx, listingFee } = await import("./payments.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: project } = await supabaseAdmin.from("projects").select("id, name, slug, submitter_id, payment_tx").eq("id", data.projectId).maybeSingle();
    if (!project) throw new Error("Project not found.");
    if (project.submitter_id !== context.userId) throw new Error("This project does not belong to you.");
    if (project.payment_tx) throw new Error("This project is already paid.");

    const fee = await listingFee();
    const { amount } = await verifyPayment(data.txHash, fee);

    const { error } = await supabaseAdmin.from("projects")
      .update({ payment_tx: data.txHash, payment_amount: amount, payment_at: new Date().toISOString(), is_public: true } as never)
      .eq("id", data.projectId);
    if (error) throw new Error(error.message);

    await logTx({ userId: context.userId, kind: "listing", description: `Listing fee — ${project.name}`, referenceId: project.slug, amountXlm: amount, txHash: data.txHash, account: data.account ?? null });
    return { ok: true, amount };
  });

export const verifyFounderPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ txHash: hash, account: z.string().nullish() }).parse(d))
  .handler(async ({ data, context }) => {
    const { verifyPayment, logTx, founderPrice } = await import("./payments.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const price = await founderPrice();
    const { amount } = await verifyPayment(data.txHash, price);

    const { error } = await supabaseAdmin.from("founder_memberships").upsert({
      user_id: context.userId, source: "paid", tx_hash: data.txHash,
      account: data.account ?? null, amount_xrp: amount, revoked: false,
      updated_at: new Date().toISOString(),
    } as never, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("user_roles").upsert({ user_id: context.userId, role: "founder" } as never, { onConflict: "user_id,role" });

    await logTx({ userId: context.userId, kind: "founder", description: "Founder Membership", referenceId: "founder", amountXlm: amount, txHash: data.txHash, account: data.account ?? null });
    return { ok: true, amount };
  });

export const verifyPromotionPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ packageId: z.string().uuid(), projectSlug: z.string().min(1), txHash: hash, account: z.string().nullish() }).parse(d))
  .handler(async ({ data, context }) => {
    const { verifyPayment, logTx } = await import("./payments.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pkg } = await supabaseAdmin.from("promotion_packages").select("*").eq("id", data.packageId).eq("active", true).maybeSingle();
    if (!pkg) throw new Error("Promotion package not found.");
    const { data: project } = await supabaseAdmin.from("projects").select("name, submitter_id").eq("slug", data.projectSlug).maybeSingle();
    if (!project || project.submitter_id !== context.userId) throw new Error("This project does not belong to you.");

    const { amount } = await verifyPayment(data.txHash, Number(pkg.price_xrp));

    const now = new Date();
    const ends = new Date(now.getTime() + pkg.duration_days * 86400000);
    const { error } = await supabaseAdmin.from("project_promotions").insert({
      project_slug: data.projectSlug, user_id: context.userId, slot: pkg.slot,
      duration_days: pkg.duration_days, amount_xrp: amount, tx_hash: data.txHash,
      status: "active", starts_at: now.toISOString(), ends_at: ends.toISOString(),
    } as never);
    if (error) throw new Error(error.message);

    await logTx({ userId: context.userId, kind: "promotion", description: `${pkg.slot} promotion — ${project.name} (${pkg.duration_days} days)`, referenceId: data.projectSlug, amountXlm: amount, txHash: data.txHash, account: data.account ?? null });
    return { ok: true, amount };
  });

export const verifyBadgePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ tierKey: z.string().min(1), txHash: hash, account: z.string().nullish() }).parse(d))
  .handler(async ({ data, context }) => {
    const { verifyPayment, logTx } = await import("./payments.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tier } = await supabaseAdmin.from("badge_tiers").select("*").eq("key", data.tierKey).eq("active", true).maybeSingle();
    if (!tier) throw new Error("Badge tier not found.");
    const { data: profile } = await supabaseAdmin.from("author_profiles").select("id").eq("user_id", context.userId).maybeSingle();
    if (!profile) throw new Error("Create your company profile first.");

    const { amount } = await verifyPayment(data.txHash, Number(tier.price_xrp));

    await supabaseAdmin.from("badge_purchases").insert({
      user_id: context.userId, tier_key: tier.key, amount_xrp: amount, tx_hash: data.txHash, status: "success",
    } as never);
    const { error } = await supabaseAdmin.from("author_profiles")
      .update({ badge_tier: tier.key, badge_since: new Date().toISOString(), verified: true } as never)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    await logTx({ userId: context.userId, kind: "badge", description: `${tier.name} lifetime badge`, referenceId: tier.key, amountXlm: amount, txHash: data.txHash, account: data.account ?? null });
    return { ok: true, amount };
  });
