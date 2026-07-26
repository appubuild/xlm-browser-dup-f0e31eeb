import { createClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";

const XUMM_API = "https://xumm.app/api/v1/platform";

export type XamanCreds = {
  apiKey: string;
  apiSecret: string;
  network: "Mainnet" | "Testnet";
  rpcUrl: string;
  treasuryAddress: string;
  source: string;
};

function env(name: string, viteName?: string): string | undefined {
  const v = typeof process !== "undefined" ? process.env?.[name] : undefined;
  if (v) return v;
  if (viteName && typeof import.meta.env !== "undefined" && import.meta.env[viteName]) {
    return import.meta.env[viteName] as string;
  }
  return undefined;
}

function serverSupabase() {
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SERVICE_ROLE_KEY;
  const publishable = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url) return { client: null, source: "none", reason: "SUPABASE_URL is not set on the server." };
  if (serviceKey) {
    return {
      client: createClient<Database>(url, serviceKey, {
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      }),
      source: "service-role",
      reason: "service-role key present",
    };
  }
  if (!publishable) return { client: null, source: "none", reason: "no service-role and no publishable key on the server." };
  const authHeader = getRequest()?.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return { client: null, source: "none", reason: "no service-role key and no signed-in user token." };
  return {
    client: createClient<Database>(url, publishable, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    }),
    source: "user-session",
    reason: "using signed-in user token (admins only under RLS)",
  };
}

/** Public (non-secret) part of the wallet config — readable by ANY visitor through a
 *  security-definer RPC, so signing in / paying never depends on the caller being an admin. */
async function loadPublicConfig(): Promise<{ network?: string; rpcUrl?: string; treasuryAddress?: string }> {
  const url = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const publishable = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !publishable) return {};
  try {
    const anon = createClient<Database>(url, publishable, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data } = await anon.rpc("xaman_public_config" as never);
    const row = Array.isArray(data) ? (data[0] as Record<string, string> | undefined) : undefined;
    if (!row) return {};
    return { network: row.network, rpcUrl: row.rpc_url, treasuryAddress: row.treasury_address };
  } catch {
    return {};
  }
}

/** Load Xaman credentials: env secrets first, then the admin-saved wallet_config row. */
export async function loadXamanCreds(): Promise<XamanCreds> {
  const steps: string[] = [];
  const envKey = env("XAMAN_API_KEY");
  const envSecret = env("XAMAN_API_SECRET");
  let creds: XamanCreds = {
    apiKey: envKey ?? "",
    apiSecret: envSecret ?? "",
    network: "Mainnet",
    rpcUrl: "https://xrplcluster.com",
    treasuryAddress: "",
    source: "env",
  };

  // Non-secret settings (network / rpc / treasury) work for every visitor.
  const pub = await loadPublicConfig();
  if (pub.network === "Mainnet" || pub.network === "Testnet") creds.network = pub.network;
  if (pub.rpcUrl) creds.rpcUrl = pub.rpcUrl;
  if (pub.treasuryAddress) creds.treasuryAddress = pub.treasuryAddress;

  if (creds.apiKey && creds.apiSecret) return creds;
  steps.push("XAMAN_API_KEY / XAMAN_API_SECRET are not both set as deployment secrets.");

  const { client, reason, source } = serverSupabase();
  if (!client) {
    steps.push(`Could not read wallet_config: ${reason}`);
  } else {
    const { data, error } = await client
      .from("wallet_config" as never)
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) steps.push(`Reading wallet_config via ${source} failed: ${error.message}`);
    else if (!data) steps.push("wallet_config row id=1 is missing — save the wallet settings once in Admin → Wallet Connect Config.");
    else {
      const r = data as Record<string, string>;
      creds = {
        apiKey: r.xaman_api_key || creds.apiKey,
        apiSecret: r.xaman_api_secret || creds.apiSecret,
        network: (r.network as "Mainnet" | "Testnet") || creds.network,
        rpcUrl: r.rpc_url || creds.rpcUrl,
        treasuryAddress: r.treasury_address || creds.treasuryAddress,
        source: `wallet_config (${source})`,
      };
      if (creds.apiKey && creds.apiSecret) return creds;
      steps.push("wallet_config was read, but the Xaman API key and/or secret field is empty.");
    }
  }

  throw new Error(
    `Xaman is not configured on this deployment.\n\nWhat actually failed:\n- ${steps.join(
      "\n- ",
    )}\n\nFix: paste your API key + secret in Admin → Wallet Connect Config and save, then ask the site owner to add XAMAN_API_KEY and XAMAN_API_SECRET as deployment secrets so every visitor (not just admins) can connect.`,
  );
}


async function xummFetch(path: string, creds: XamanCreds, init?: RequestInit) {
  const res = await fetch(`${XUMM_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": creds.apiKey,
      "X-API-Secret": creds.apiSecret,
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    const err = body as { error?: { code?: number; reference?: string; message?: string } };
    const detail = err?.error?.message || (typeof body === "string" ? body : JSON.stringify(body));
    throw new Error(`Xaman API ${res.status}: ${detail}`);
  }
  return body as Record<string, unknown>;
}

type PayloadCreated = {
  uuid: string;
  next: { always: string };
  refs: { qr_png: string; websocket_status: string };
};

export async function createSignInPayload(returnUrl?: string) {
  const creds = await loadXamanCreds();
  const body = {
    txjson: { TransactionType: "SignIn" },
    options: {
      submit: false,
      expire: 5,
      ...(returnUrl ? { return_url: { web: returnUrl, app: returnUrl } } : {}),
    },
  };
  const created = (await xummFetch("/payload", creds, {
    method: "POST",
    body: JSON.stringify(body),
  })) as unknown as PayloadCreated;
  return {
    uuid: created.uuid,
    qrPng: created.refs.qr_png,
    websocket: created.refs.websocket_status,
    deeplink: created.next.always,
    network: creds.network,
  };
}

export async function createPaymentPayload(opts: { amountXrp: number; memo?: string; returnUrl?: string }) {
  const creds = await loadXamanCreds();
  if (!creds.treasuryAddress) throw new Error("Treasury address is not set in Admin → Wallet Connect Config.");
  const drops = String(Math.round(opts.amountXrp * 1_000_000));
  const created = (await xummFetch("/payload", creds, {
    method: "POST",
    body: JSON.stringify({
      txjson: {
        TransactionType: "Payment",
        Destination: creds.treasuryAddress,
        Amount: drops,
      },
      custom_meta: opts.memo ? { instruction: opts.memo.slice(0, 240) } : undefined,
      options: {
        submit: true,
        expire: 10,
        ...(opts.returnUrl ? { return_url: { web: opts.returnUrl, app: opts.returnUrl } } : {}),
      },
    }),
  })) as unknown as PayloadCreated;
  return {
    uuid: created.uuid,
    qrPng: created.refs.qr_png,
    deeplink: created.next.always,
    destination: creds.treasuryAddress,
    amountXrp: opts.amountXrp,
  };
}

export async function getPayloadStatus(uuid: string) {
  const creds = await loadXamanCreds();
  const data = (await xummFetch(`/payload/${encodeURIComponent(uuid)}`, creds)) as {
    meta?: { resolved?: boolean; signed?: boolean; expired?: boolean; cancelled?: boolean };
    response?: { account?: string | null; txid?: string | null; dispatched_result?: string | null };
  };
  return {
    resolved: !!data.meta?.resolved,
    signed: !!data.meta?.signed,
    expired: !!data.meta?.expired,
    cancelled: !!data.meta?.cancelled,
    account: data.response?.account ?? null,
    txid: data.response?.txid ?? null,
    result: data.response?.dispatched_result ?? null,
  };
}

/** XRP balance in XRP (not drops) using a public XRPL JSON-RPC endpoint. */
export async function getXrpBalance(account: string, network: "Mainnet" | "Testnet" = "Mainnet") {
  const rpc = network === "Testnet" ? "https://s.altnet.rippletest.net:51234" : "https://xrplcluster.com";
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "account_info",
      params: [{ account, ledger_index: "validated" }],
    }),
  });
  if (!res.ok) throw new Error(`XRPL RPC ${res.status}`);
  const json = (await res.json()) as {
    result?: { account_data?: { Balance?: string }; error?: string };
  };
  if (json.result?.error) return { balance: 0, funded: false };
  const drops = Number(json.result?.account_data?.Balance ?? 0);
  return { balance: drops / 1_000_000, funded: drops > 0 };
}
