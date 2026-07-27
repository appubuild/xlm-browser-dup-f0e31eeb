const XAMAN_API = "https://xumm.app/api/v1/platform";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type XamanCreds = {
  apiKey: string;
  apiSecret: string;
  network: "Mainnet" | "Testnet";
  rpcUrl: string;
  treasuryAddress: string;
};

type PayloadCreated = {
  uuid: string;
  next: { always: string };
  refs: { qr_png: string; websocket_status: string };
};

function envAny(names: string[]): { value: string; source: string } | null {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value) return { value, source: name };
  }
  return null;
}

function isOpaqueSupabaseKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
  });
}

async function readWalletConfigWithServiceRole() {
  const url = Deno.env.get("SUPABASE_URL");
  const service = envAny([
    "SUPABASE_SERVICE_ROLE_KEY",
    "SB_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_KEY",
    "SUPABASE_SERVICE_ROLE",
    "SERVICE_ROLE_KEY",
  ]);
  if (!url || !service?.value) return null;

  const headers = new Headers({ apikey: service.value });
  if (!isOpaqueSupabaseKey(service.value)) headers.set("Authorization", `Bearer ${service.value}`);

  const res = await fetch(`${url}/rest/v1/wallet_config?id=eq.1&select=*`, { headers });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<Record<string, string>>;
  return rows[0] ?? null;
}

async function loadCreds(): Promise<XamanCreds> {
  const key = envAny(["XAMAN_API_KEY", "XUMM_API_KEY"]);
  const secret = envAny(["XAMAN_API_SECRET", "XAMAN_API_SECRE", "XAMAN_API_SECRET_KEY", "XUMM_API_SECRET"]);
  const walletConfig = await readWalletConfigWithServiceRole();

  const networkValue = walletConfig?.network;
  const network: "Mainnet" | "Testnet" = networkValue === "Testnet" ? "Testnet" : "Mainnet";
  const creds = {
    apiKey: key?.value || walletConfig?.xaman_api_key || "",
    apiSecret: secret?.value || walletConfig?.xaman_api_secret || "",
    network,
    rpcUrl: walletConfig?.rpc_url || "https://xrplcluster.com",
    treasuryAddress: walletConfig?.treasury_address || "",
  };

  if (!creds.apiKey || !creds.apiSecret) {
    throw new Error(
      `Xaman credentials are missing in Supabase Edge Function secrets and wallet_config. Found API key: ${key?.source ?? (walletConfig?.xaman_api_key ? "wallet_config" : "no")}; found API secret: ${secret?.source ?? (walletConfig?.xaman_api_secret ? "wallet_config" : "no")}.`,
    );
  }

  return creds;
}

async function xamanFetch(path: string, creds: XamanCreds, init?: RequestInit) {
  const res = await fetch(`${XAMAN_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": creds.apiKey,
      "X-API-Secret": creds.apiSecret,
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Keep the raw Xaman response text.
  }
  if (!res.ok) {
    const err = body as { error?: { message?: string } };
    const detail = err?.error?.message || (typeof body === "string" ? body : JSON.stringify(body));
    throw new Error(`Xaman API ${res.status}: ${detail}`);
  }
  return body as Record<string, unknown>;
}

function optionalReturnUrl(value: unknown) {
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : undefined;
}

async function createSignIn(returnUrl?: string) {
  const creds = await loadCreds();
  const created = (await xamanFetch("/payload", creds, {
    method: "POST",
    body: JSON.stringify({
      txjson: { TransactionType: "SignIn" },
      options: {
        submit: false,
        expire: 5,
        ...(returnUrl ? { return_url: { web: returnUrl, app: returnUrl } } : {}),
      },
    }),
  })) as unknown as PayloadCreated;

  return {
    uuid: created.uuid,
    qrPng: created.refs.qr_png,
    websocket: created.refs.websocket_status,
    deeplink: created.next.always,
    network: creds.network,
  };
}

async function createPayment(amountXrp: unknown, memo?: unknown, returnUrl?: string) {
  const amount = typeof amountXrp === "number" ? amountXrp : Number(amountXrp);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) throw new Error("Invalid XRP amount.");

  const creds = await loadCreds();
  if (!creds.treasuryAddress) throw new Error("Treasury address is not set in Admin → Wallet Connect Config.");

  const created = (await xamanFetch("/payload", creds, {
    method: "POST",
    body: JSON.stringify({
      txjson: {
        TransactionType: "Payment",
        Destination: creds.treasuryAddress,
        Amount: String(Math.round(amount * 1_000_000)),
      },
      custom_meta: typeof memo === "string" && memo ? { instruction: memo.slice(0, 240) } : undefined,
      options: {
        submit: true,
        expire: 10,
        ...(returnUrl ? { return_url: { web: returnUrl, app: returnUrl } } : {}),
      },
    }),
  })) as unknown as PayloadCreated;

  return {
    uuid: created.uuid,
    qrPng: created.refs.qr_png,
    deeplink: created.next.always,
    destination: creds.treasuryAddress,
    amountXrp: amount,
  };
}

async function getStatus(uuid: unknown) {
  if (typeof uuid !== "string" || uuid.length < 10 || uuid.length > 80) throw new Error("Invalid Xaman payload ID.");
  const creds = await loadCreds();
  const data = (await xamanFetch(`/payload/${encodeURIComponent(uuid)}`, creds)) as {
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action;
    if (action === "signin") return json({ ok: true, data: await createSignIn(optionalReturnUrl(body.returnUrl)) });
    if (action === "pay") return json({ ok: true, data: await createPayment(body.amountXrp, body.memo, optionalReturnUrl(body.returnUrl)) });
    if (action === "status") return json({ ok: true, data: await getStatus(body.uuid) });
    return json({ ok: false, error: "Unknown Xaman action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xaman request failed";
    console.error("[xaman-proxy]", message);
    return json({ ok: false, error: message }, 200);
  }
});