import { createClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

type AiProvider = "openai" | "anthropic" | "google";

interface AiConfig {
  provider: AiProvider;
  model: string;
  openai_key: string;
  anthropic_key: string;
  google_key: string;
}

function isProvider(value: unknown): value is AiProvider {
  return value === "openai" || value === "anthropic" || value === "google";
}

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function envConfig(): AiConfig {
  const providerValue = process.env.AI_PROVIDER;
  const provider = isProvider(providerValue) ? providerValue : "openai";
  return {
    provider,
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
    openai_key: process.env.OPENAI_API_KEY ?? "",
    anthropic_key: process.env.ANTHROPIC_API_KEY ?? "",
    google_key: process.env.GOOGLE_API_KEY ?? "",
  };
}

function hasKeyForProvider(config: AiConfig): boolean {
  if (config.provider === "openai") return Boolean(config.openai_key);
  if (config.provider === "anthropic") return Boolean(config.anthropic_key);
  return Boolean(config.google_key);
}

function mergeConfig(base: AiConfig, row: Partial<AiConfig> | null | undefined): AiConfig {
  if (!row) return base;
  return {
    provider: isProvider(row.provider) ? row.provider : base.provider,
    model: row.model || base.model,
    openai_key: row.openai_key || base.openai_key,
    anthropic_key: row.anthropic_key || base.anthropic_key,
    google_key: row.google_key || base.google_key,
  };
}

type ConfigSource = "service-role" | "user-session" | "none";

interface ClientResult {
  client: ReturnType<typeof createClient<Database>> | null;
  source: ConfigSource;
  reason: string;
}

function createServerSupabaseClient(): ClientResult {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SERVICE_ROLE_KEY;

  if (!url) {
    return { client: null, source: "none", reason: "SUPABASE_URL is not set in the deployment environment." };
  }

  if (serviceKey) {
    return {
      client: createClient<Database>(url, serviceKey, {
        global: { fetch: createSupabaseFetch(serviceKey) },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      }),
      source: "service-role",
      reason: `service-role key found (${process.env.SUPABASE_SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : "SB_SERVICE_ROLE_KEY"})`,
    };
  }

  if (!publishableKey) {
    return {
      client: null,
      source: "none",
      reason: "no service-role key (SUPABASE_SERVICE_ROLE_KEY / SB_SERVICE_ROLE_KEY) and no SUPABASE_PUBLISHABLE_KEY in the deployment environment.",
    };
  }

  const authHeader = getRequest()?.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  if (!token || token.split(".").length !== 3) {
    return {
      client: null,
      source: "none",
      reason: "no service-role key in the deployment environment, and the request carried no signed-in user token (so the admin-saved keys in ai_config cannot be read).",
    };
  }

  return {
    client: createClient<Database>(url, publishableKey, {
      global: {
        fetch: createSupabaseFetch(publishableKey),
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    }),
    source: "user-session",
    reason: "using the signed-in user's token (only admins can read ai_config under RLS)",
  };
}

function providerKeyName(provider: AiProvider): string {
  if (provider === "openai") return "OPENAI_API_KEY";
  if (provider === "anthropic") return "ANTHROPIC_API_KEY";
  return "GOOGLE_API_KEY";
}

async function loadAiConfig(): Promise<AiConfig> {
  const fallback = envConfig();
  const { client: supabase, source, reason } = createServerSupabaseClient();
  const steps: string[] = [`Supabase access: ${reason}`];

  if (supabase) {
    const { data, error } = await supabase
      .from("ai_config")
      .select("provider, model, openai_key, anthropic_key, google_key")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      steps.push(
        `Reading ai_config via ${source} failed: ${error.message}${error.code ? ` (code ${error.code})` : ""}.` +
          (source === "user-session"
            ? " RLS only allows admins to read ai_config, so this path works only while an admin is signed in."
            : ""),
      );
    } else if (!data) {
      steps.push("ai_config row id=1 does not exist yet — open Admin → Site Settings → AI Providers and save your keys once.");
    } else {
      const merged = mergeConfig(fallback, data as Partial<AiConfig>);
      if (hasKeyForProvider(merged)) return merged;
      steps.push(
        `ai_config was read successfully, but the selected provider "${merged.provider}" has an empty API key field. Paste the ${merged.provider} key in Admin → Site Settings → AI Providers and save.`,
      );
    }
  }

  if (hasKeyForProvider(fallback)) return fallback;
  steps.push(
    `No deployment env fallback either: ${providerKeyName(fallback.provider)} is not set (provider "${fallback.provider}").`,
  );

  const message = `AI is not configured on this deployment.\n\nWhat actually failed:\n- ${steps.join("\n- ")}\n\nFix: add SB_SERVICE_ROLE_KEY (Supabase service_role key) to the Cloudflare Worker secrets so the server can read the keys saved in Admin → Site Settings, or set ${providerKeyName(fallback.provider)} as a Worker secret.`;
  console.error("[AI config]", message);
  throw new Error(message);
}


const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504, 529]);

function friendlyError(provider: string, status: number, body: string): Error {
  if (status === 429) {
    return new Error(`${provider} is rate limiting requests right now. Please wait a moment and try again.`);
  }
  if (RETRYABLE_STATUS.has(status)) {
    return new Error(`${provider} is temporarily overloaded (${status}). Please try again in a few seconds, or pick another model in Admin → Site Settings → AI Providers.`);
  }
  return new Error(`${provider} ${status}: ${body.slice(0, 300)}`);
}

async function fetchWithRetry(
  provider: string,
  url: string,
  init: RequestInit,
  attempts = 3,
): Promise<Response> {
  let lastError: Error = new Error(`${provider} request failed`);
  for (let attempt = 0; attempt < attempts; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      lastError = new Error(`${provider} network error: ${err instanceof Error ? err.message : String(err)}`);
      if (attempt < attempts - 1) {
        await new Promise((r) => setTimeout(r, 700 * 2 ** attempt));
        continue;
      }
      throw lastError;
    }

    if (res.ok) return res;

    const body = await res.text();
    lastError = friendlyError(provider, res.status, body);
    if (RETRYABLE_STATUS.has(res.status) && attempt < attempts - 1) {
      await new Promise((r) => setTimeout(r, 700 * 2 ** attempt));
      continue;
    }
    throw lastError;
  }
  throw lastError;
}

export async function callAi(messages: AiMessage[], opts: { temperature?: number; json?: boolean } = {}): Promise<string> {
  const cfg = await loadAiConfig();

  if (cfg.provider === "openai") {
    if (!cfg.openai_key) throw new Error("OpenAI API key not configured in Admin → Site Settings → AI Providers.");
    const res = await fetchWithRetry("OpenAI", "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${cfg.openai_key}` },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: opts.temperature ?? 0.4,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  }

  if (cfg.provider === "anthropic") {
    if (!cfg.anthropic_key) throw new Error("Anthropic (Claude) API key not configured in Admin → Site Settings → AI Providers.");
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const rest = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }));
    const res = await fetchWithRetry("Anthropic", "https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cfg.anthropic_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: cfg.model,
        system: system || undefined,
        messages: rest,
        max_tokens: 2048,
        temperature: opts.temperature ?? 0.4,
      }),
    });
    const data = await res.json();
    return Array.isArray(data?.content) ? data.content.map((b: { text?: string }) => b.text ?? "").join("") : "";
  }

  if (!cfg.google_key) throw new Error("Google (Gemini) API key not configured in Admin → Site Settings → AI Providers.");
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const body = JSON.stringify({
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  });

  // If the configured model is overloaded, try a lighter fallback model before giving up.
  const fallbacks = ["gemini-2.0-flash", "gemini-1.5-flash"].filter((m) => m !== cfg.model);
  const models = [cfg.model, ...fallbacks];

  let lastError: Error = new Error("Gemini request failed");
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${cfg.google_key}`;
    try {
      const res = await fetchWithRetry("Gemini", url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      return parts.map((p: { text?: string }) => p.text ?? "").join("");
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (!/overloaded|rate limiting|network error/i.test(lastError.message)) throw lastError;
    }
  }
  throw lastError;
}