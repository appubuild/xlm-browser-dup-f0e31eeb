import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Msg = { role: "system" | "user" | "assistant"; content: string };

interface AiConfig {
  provider: "openai" | "anthropic" | "google";
  model: string;
  openai_key: string;
  anthropic_key: string;
  google_key: string;
}

async function loadAiConfig(): Promise<AiConfig> {
  const envCfg: AiConfig = {
    provider: (process.env.AI_PROVIDER as AiConfig["provider"]) ?? "openai",
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
    openai_key: process.env.OPENAI_API_KEY ?? "",
    anthropic_key: process.env.ANTHROPIC_API_KEY ?? "",
    google_key: process.env.GOOGLE_API_KEY ?? "",
  };

  const { getServiceRoleKey, createAdminClient } = await import("@/lib/admin-db.server");

  if (!getServiceRoleKey()) {
    if (envCfg.openai_key || envCfg.anthropic_key || envCfg.google_key) return envCfg;
    throw new Error(
      "AI is not reachable: the server cannot read the API keys saved in Admin → Site Settings → AI Providers because the Supabase service role key secret (SB_SERVICE_ROLE_KEY) is missing.",
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("ai_config" as never).select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Failed to load AI config: ${error.message}`);
  const r = (data ?? {}) as Partial<AiConfig>;
  return {
    provider: (r.provider as AiConfig["provider"]) ?? envCfg.provider,
    model: r.model ?? envCfg.model,
    openai_key: r.openai_key || envCfg.openai_key,
    anthropic_key: r.anthropic_key || envCfg.anthropic_key,
    google_key: r.google_key || envCfg.google_key,
  };
}

async function callAi(messages: Msg[], opts: { temperature?: number; json?: boolean } = {}): Promise<string> {
  const cfg = await loadAiConfig();
  const { provider, model } = cfg;

  if (provider === "openai") {
    if (!cfg.openai_key) throw new Error("OpenAI API key not configured in Admin → Site Settings → AI Providers.");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${cfg.openai_key}` },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.4,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  }

  if (provider === "anthropic") {
    if (!cfg.anthropic_key) throw new Error("Anthropic (Claude) API key not configured in Admin → Site Settings → AI Providers.");
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const rest = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }));
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cfg.anthropic_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        system: system || undefined,
        messages: rest,
        max_tokens: 2048,
        temperature: opts.temperature ?? 0.4,
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const text = Array.isArray(data?.content) ? data.content.map((b: { text?: string }) => b.text ?? "").join("") : "";
    return text;
  }

  if (provider === "google") {
    if (!cfg.google_key) throw new Error("Google (Gemini) API key not configured in Admin → Site Settings → AI Providers.");
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${cfg.google_key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: {
          temperature: opts.temperature ?? 0.4,
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: { text?: string }) => p.text ?? "").join("");
  }

  throw new Error(`Unknown AI provider: ${provider}`);
}

const ChatInput = z.object({
  projectName: z.string(),
  projectTagline: z.string().optional().default(""),
  aiDoc: z.string(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  question: z.string().min(1).max(2000),
});

export const askProjectAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const doc = (data.aiDoc || "").slice(0, 12000);
    const system = `You are the official AI assistant for the XRPL project "${data.projectName}"${
      data.projectTagline ? ` (${data.projectTagline})` : ""
    }. Answer public users' questions concisely and accurately using ONLY the project documentation below. If a question is not covered, say you don't have that information and suggest contacting the project directly.

=== PROJECT DOCUMENTATION ===
${doc || "(No documentation provided by the project owner.)"}
=== END DOCUMENTATION ===`;
    const messages: Msg[] = [
      { role: "system", content: system },
      ...data.history.slice(-10),
      { role: "user", content: data.question },
    ];
    const reply = await callAi(messages, { temperature: 0.3 });
    return { reply };
  });

const FaqInput = z.object({ projectName: z.string(), aiDoc: z.string() });

export const generateProjectFaq = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FaqInput.parse(input))
  .handler(async ({ data }) => {
    const doc = (data.aiDoc || "").slice(0, 12000);
    if (!doc.trim()) return { faq: [] as { q: string; a: string }[] };
    const system = `You generate a short public FAQ for an XRPL project from its documentation. Output ONLY strict JSON: {"faq":[{"q":"...","a":"..."}]}. Include 5-8 concise Q&A pairs.`;
    const user = `Project: ${data.projectName}\n\nDOCUMENTATION:\n${doc}`;
    const reply = await callAi(
      [{ role: "system", content: system }, { role: "user", content: user }],
      { temperature: 0.2, json: true },
    );
    try {
      const parsed = JSON.parse(reply);
      const faq = Array.isArray(parsed?.faq) ? parsed.faq.slice(0, 12) : [];
      return { faq };
    } catch {
      return { faq: [] as { q: string; a: string }[] };
    }
  });

const BlogPostInput = z.object({
  category: z.string().default(""),
  angle: z.string().default(""),
  instruction: z.string().default(""),
});
export const generateBlogPost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BlogPostInput.parse(input))
  .handler(async ({ data }) => {
    const system = `${data.instruction || "You are a helpful blog writer for XRPBrowser."}
Write an engaging blog article in clean HTML (use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <a>). Do NOT wrap in <html> or <body>.
Return ONLY strict JSON: {"title":"...","excerpt":"...","body":"<html>","tags":["..."]}. Keep excerpt under 200 chars.`;
    const user = `Category: ${data.category || "General"}\nAngle/Topic: ${data.angle || "(pick a compelling XRPL angle)"}`;
    const reply = await callAi(
      [{ role: "system", content: system }, { role: "user", content: user }],
      { temperature: 0.7, json: true },
    );
    try {
      const parsed = JSON.parse(reply);
      return {
        title: String(parsed.title ?? ""),
        excerpt: String(parsed.excerpt ?? ""),
        body: String(parsed.body ?? ""),
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10).map(String) : [],
      };
    } catch {
      return { title: "", excerpt: "", body: reply, tags: [] as string[] };
    }
  });

const SeoInput = z.object({ title: z.string(), body: z.string() });
export const generateBlogSeo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SeoInput.parse(input))
  .handler(async ({ data }) => {
    const system = `Generate SEO metadata for a blog post. Return ONLY JSON: {"metaDescription":"...","keywords":["..."],"slug":"kebab-case-slug"}. metaDescription <=155 chars.`;
    const user = `Title: ${data.title}\n\nBody (HTML, may be trimmed):\n${data.body.slice(0, 6000)}`;
    const reply = await callAi(
      [{ role: "system", content: system }, { role: "user", content: user }],
      { temperature: 0.3, json: true },
    );
    try {
      const parsed = JSON.parse(reply);
      return {
        metaDescription: String(parsed.metaDescription ?? "").slice(0, 200),
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 20).map(String) : [],
        slug: String(parsed.slug ?? "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""),
      };
    } catch {
      return { metaDescription: "", keywords: [] as string[], slug: "" };
    }
  });
