import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
    const { callAi } = await import("@/lib/ai.server");
    const doc = (data.aiDoc || "").slice(0, 12000);
    const system = `You are the official AI assistant for the XRPL project "${data.projectName}"${
      data.projectTagline ? ` (${data.projectTagline})` : ""
    }. Answer public users' questions concisely and accurately using ONLY the project documentation below. If a question is not covered, say you don't have that information and suggest contacting the project directly.

=== PROJECT DOCUMENTATION ===
${doc || "(No documentation provided by the project owner.)"}
=== END DOCUMENTATION ===`;
    const messages = [
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
    const { callAi } = await import("@/lib/ai.server");
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
    const { callAi } = await import("@/lib/ai.server");
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
    const { callAi } = await import("@/lib/ai.server");
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
