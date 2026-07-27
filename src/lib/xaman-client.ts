import { supabase } from "@/integrations/supabase/client";

export type XamanResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type XamanSignInPayload = {
  uuid: string;
  qrPng: string;
  websocket?: string;
  deeplink: string;
  network?: "Mainnet" | "Testnet";
};

export type XamanPaymentPayload = {
  uuid: string;
  qrPng: string;
  deeplink: string;
  destination: string;
  amountXrp: number;
};

export type XamanStatusPayload = {
  resolved: boolean;
  signed: boolean;
  expired: boolean;
  cancelled: boolean;
  account: string | null;
  txid: string | null;
  result: string | null;
};

export function shouldUseXamanProxy(error: string): boolean {
  return [
    "Xaman is not configured on this deployment",
    "required server secrets",
    "XAMAN API deployment secrets are incomplete",
    "wallet_config row id=1 is hidden",
    "self-hosted Cloudflare Worker",
  ].some((needle) => error.includes(needle));
}

export async function callXamanProxy<T>(body: Record<string, unknown>): Promise<XamanResult<T>> {
  const { data, error } = await supabase.functions.invoke("xaman-proxy", { body });
  if (error) return { ok: false, error: `Supabase Xaman fallback failed: ${error.message}` };
  if (!data || typeof data !== "object") return { ok: false, error: "Supabase Xaman fallback returned an empty response." };
  const result = data as XamanResult<T>;
  if (!result.ok) return { ok: false, error: result.error || "Supabase Xaman fallback could not create a request." };
  return result;
}

export function formatXamanConnectError(workerError: string, fallbackError?: string): string {
  if (!fallbackError) return workerError;
  return [
    "Xaman connection could not be started.",
    "",
    "Self-hosted Worker result:",
    workerError,
    "",
    "Supabase fallback result:",
    fallbackError,
  ].join("\n");
}