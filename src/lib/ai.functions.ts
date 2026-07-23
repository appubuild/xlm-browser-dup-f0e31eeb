import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callGateway(body: unknown): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI gateway ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
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
    const messages = [
      { role: "system", content: system },
      ...data.history.slice(-10),
      { role: "user", content: data.question },
    ];
    const reply = await callGateway({ model: MODEL, messages, temperature: 0.3 });
    return { reply };
  });

const FaqInput = z.object({
  projectName: z.string(),
  aiDoc: z.string(),
});

export const generateProjectFaq = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FaqInput.parse(input))
  .handler(async ({ data }) => {
    const doc = (data.aiDoc || "").slice(0, 12000);
    if (!doc.trim()) return { faq: [] as { q: string; a: string }[] };
    const system = `You generate a short public FAQ for an XRPL project from its documentation. Output ONLY strict JSON: {"faq":[{"q":"...","a":"..."}]}. Include 5-8 concise Q&A pairs.`;
    const user = `Project: ${data.projectName}\n\nDOCUMENTATION:\n${doc}`;
    const reply = await callGateway({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });
    try {
      const parsed = JSON.parse(reply);
      const faq = Array.isArray(parsed?.faq) ? parsed.faq.slice(0, 12) : [];
      return { faq };
    } catch {
      return { faq: [] as { q: string; a: string }[] };
    }
  });
