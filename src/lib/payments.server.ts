/**
 * Server-only Stellar payment verification.
 *
 * Every grant (listing, founder, promotion, badge) must go through
 * `verifyPayment()`: the transaction hash is looked up on Horizon and the
 * destination, asset and amount are checked against the values stored in the
 * database. Client-supplied amounts are never trusted, and a hash can only be
 * used once.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const HORIZON = {
  Mainnet: "https://horizon.stellar.org",
  Testnet: "https://horizon-testnet.stellar.org",
} as const;

export type WalletCfg = { treasury: string; horizon: string; network: "Mainnet" | "Testnet" };

export async function walletConfig(): Promise<WalletCfg> {
  const { data } = await supabaseAdmin.from("wallet_config").select("*").eq("id", 1).maybeSingle();
  const r = (data ?? {}) as Record<string, unknown>;
  const network = r["network"] === "Testnet" ? "Testnet" : "Mainnet";
  const url = typeof r["rpc_url"] === "string" ? r["rpc_url"].trim() : "";
  const horizon = /^https?:\/\//i.test(url) && !/xrpl|ripple/i.test(url) ? url : HORIZON[network];
  return { treasury: (r["treasury_address"] as string) ?? "", horizon, network };
}

/** Rejects a hash that was already consumed by any other paid feature. */
async function assertHashUnused(txHash: string) {
  const checks = await Promise.all([
    supabaseAdmin.from("projects").select("id").eq("payment_tx", txHash).limit(1),
    supabaseAdmin.from("founder_memberships").select("id").eq("tx_hash", txHash).limit(1),
    supabaseAdmin.from("project_promotions").select("id").eq("tx_hash", txHash).limit(1),
    supabaseAdmin.from("badge_purchases").select("id").eq("tx_hash", txHash).limit(1),
  ]);
  if (checks.some((c) => (c.data ?? []).length > 0)) {
    throw new Error("This transaction hash has already been used.");
  }
}

type HorizonOp = {
  type: string;
  asset_type?: string;
  to?: string;
  account?: string;
  amount?: string;
  starting_balance?: string;
};

/**
 * Verifies an on-ledger XLM payment to the treasury.
 * Throws with a user-readable message when anything does not line up.
 */
export async function verifyPayment(txHash: string, expectedXlm: number): Promise<{ amount: number; from: string }> {
  const hash = (txHash ?? "").trim();
  if (!/^[0-9a-fA-F]{64}$/.test(hash)) throw new Error("Invalid Stellar transaction hash.");
  await assertHashUnused(hash);

  const cfg = await walletConfig();
  if (!cfg.treasury) throw new Error("Treasury address is not configured. Ask an admin to set it in Wallet Config.");

  const txRes = await fetch(`${cfg.horizon}/transactions/${hash}`);
  if (txRes.status === 404) throw new Error("Transaction not found on the Stellar network yet. Wait a few seconds and retry.");
  if (!txRes.ok) throw new Error("Could not reach the Stellar network to verify the payment.");
  const tx = (await txRes.json()) as { successful?: boolean; source_account?: string };
  if (tx.successful === false) throw new Error("That transaction failed on-ledger.");

  const opRes = await fetch(`${cfg.horizon}/transactions/${hash}/operations?limit=200`);
  if (!opRes.ok) throw new Error("Could not read the transaction operations from Horizon.");
  const ops = ((await opRes.json()) as { _embedded?: { records?: HorizonOp[] } })._embedded?.records ?? [];

  let paid = 0;
  for (const op of ops) {
    const native = !op.asset_type || op.asset_type === "native";
    if (op.type === "payment" && native && op.to === cfg.treasury) paid += Number(op.amount ?? 0);
    if (op.type === "create_account" && op.account === cfg.treasury) paid += Number(op.starting_balance ?? 0);
  }

  if (paid <= 0) throw new Error("This transaction does not pay XLM to the treasury address.");
  if (paid + 1e-7 < expectedXlm) {
    throw new Error(`Underpaid: ${paid} XLM received, ${expectedXlm} XLM required.`);
  }
  return { amount: paid, from: tx.source_account ?? "" };
}

export async function logTx(input: {
  userId: string; kind: string; description: string; referenceId: string;
  amountXlm: number; txHash: string; account?: string | null;
}) {
  await supabaseAdmin.from("transactions").insert({
    user_id: input.userId, kind: input.kind, description: input.description,
    reference_id: input.referenceId, amount_xrp: input.amountXlm,
    tx_hash: input.txHash, account: input.account ?? null, status: "success",
  } as never);
}

/* ------------------------------------------------------------ price lookups */

export async function listingFee(): Promise<number> {
  const { data } = await supabaseAdmin.from("site_settings").select("listing_fee_xrp").eq("id", 1).maybeSingle();
  return Number((data as { listing_fee_xrp?: number } | null)?.listing_fee_xrp ?? 0);
}

export async function founderPrice(): Promise<number> {
  const { data } = await supabaseAdmin.from("pricing_tiers").select("price_xrp").eq("key", "founder").maybeSingle();
  return Number((data as { price_xrp?: number } | null)?.price_xrp ?? 2);
}
