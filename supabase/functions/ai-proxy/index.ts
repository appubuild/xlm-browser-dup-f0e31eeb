// Public AI proxy: lets the site call the admin-saved AI provider keys even when the
// hosting deployment (e.g. a self-hosted Cloudflare Worker) has no service-role secret.
// The keys never leave this function — only the generated text is returned.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AiMessage = { role: "system" | "user" | "assistant"; content: string };

type AiConfig = {
  provider: "openai" | "anthropic" | "google";
  model: string;
  openai_key: string;
  anthropic_key: string;
  google_key: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
  });
}

function envAny(names: string[]): string | null {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value) return value;
  }
  return null;
}

function isOpaqueSupabaseKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

async function loadConfig(): Promise<AiConfig | null> {
  const url = Deno.env.get("SUPABASE_URL");
  const service = envAny([
    "SUPABASE_SERVICE_ROLE_KEY",
    "SB_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_KEY",
    "SUPABASE_SERVICE_ROLE",
    "SERVICE_ROLE_KEY",
  ]);
  if (!url || !service) return null;

  const headers = new Headers({ apikey: service });
  if (!isOpaqueSupabaseKey(service)) headers.set("Authorization", `Bearer ${service}`);

  const res = await fetch(`${url}/rest/v1/ai_config?id=eq.1&select=*`, { headers });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<Record<string, string>>;
  const row = rows[0];
  if (!row) return null;

  const provider = (row.provider === "openai" || row.provider === "anthropic" || row.provider === "google")
    ? row.provider
    : "google";

  return {
    provider,
    model: row.model || (provider === "google" ? "gemini-2.5-flash" : "gpt-4o-mini"),
    openai_key: row.openai_key || Deno.env.get("OPENAI_API_KEY") || "",
    anthropic_key: row.anthropic_key || Deno.env.get("ANTHROPIC_API_KEY") || "",
    google_key: row.google_key || Deno.env.get("GOOGLE_API_KEY") || "",
  };
}

async function callProvider(cfg: AiConfig, messages: AiMessage[], opts: { temperature?: number; json?: boolean }) {
  if (cfg.provider === "openai") {
    if (!cfg.openai_key) throw new Error("OpenAI API key is empty in Admin → Site Settings → AI Providers.");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${cfg.openai_key}` },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: opts.temperature ?? 0.4,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  }

  if (cfg.provider === "anthropic") {
    if (!cfg.anthropic_key) throw new Error("Anthropic API key is empty in Admin → Site Settings → AI Providers.");
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const rest = messages.filter((m) => m.role !== "system");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
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
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return Array.isArray(data?.content) ? data.content.map((b: { text?: string }) => b.text ?? "").join("") : "";
  }

  if (!cfg.google_key) throw new Error("Google (Gemini) API key is empty in Admin → Site Settings → AI Providers.");
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

  const models = [cfg.model, "gemini-2.0-flash", "gemini-1.5-flash"].filter((m, i, a) => m && a.indexOf(m) === i);
  let lastError = new Error("Gemini request failed");
  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${cfg.google_key}`,
      { method: "POST", headers: { "content-type": "application/json" }, body },
    );
    if (res.ok) {
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      return parts.map((p: { text?: string }) => p.text ?? "").join("");
    }
    const text = (await res.text()).slice(0, 300);
    lastError = new Error(`Gemini ${res.status}: ${text}`);
    if (![429, 500, 502, 503, 504].includes(res.status)) throw lastError;
  }
  throw lastError;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const payload = (await req.json()) as {
      messages?: AiMessage[];
      temperature?: number;
      json?: boolean;
    };
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    if (messages.length === 0) return json({ error: "messages required" }, 400);

    const cfg = await loadConfig();
    if (!cfg) {
      return json(
        { error: "AI keys are not saved yet. Open Admin → Site Settings → AI Providers and save your provider key." },
        400,
      );
    }

    const text = await callProvider(cfg, messages, { temperature: payload.temperature, json: payload.json });
    return json({ text });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
