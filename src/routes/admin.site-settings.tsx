import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/admin-shell";
import { useApp } from "@/lib/app-store";
import { supabase } from "@/integrations/supabase/client";
import { aiDiagnostics } from "@/lib/ai.functions";
import { useEffect, useState } from "react";
import { toast } from "sonner";


export const Route = createFileRoute("/admin/site-settings")({ component: SiteSettings });

type AiProvider = "openai" | "anthropic" | "google";
interface AiConfigRow {
  provider: AiProvider;
  model: string;
  openai_key: string;
  anthropic_key: string;
  google_key: string;
}

const MODEL_SUGGESTIONS: Record<AiProvider, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
  anthropic: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-3-opus-latest"],
  google: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"],
};

type DiagResult = {
  ok: boolean;
  provider?: string;
  model?: string;
  keySource?: string;
  env: Record<string, boolean>;
  steps: string[];
  error?: string;
};

function AiProvidersCard() {
  const runDiag = useServerFn(aiDiagnostics);
  const [cfg, setCfg] = useState<AiConfigRow>({ provider: "openai", model: "gpt-4o-mini", openai_key: "", anthropic_key: "", google_key: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [diag, setDiag] = useState<DiagResult | null>(null);

  const runTest = async () => {
    setTesting(true);
    setDiag(null);
    try {
      const res = (await runDiag({ data: undefined })) as DiagResult;
      setDiag(res);
      if (res.ok) toast.success("AI connection OK");
      else toast.error("AI test failed — see the report below");
    } catch (err) {
      setDiag({
        ok: false,
        env: {},
        steps: ["The diagnostics request itself failed before reaching the AI provider."],
        error: err instanceof Error ? err.message : String(err),
      });
      toast.error("AI test failed");
    } finally {
      setTesting(false);
    }
  };


  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("ai_config" as never).select("*").eq("id", 1).maybeSingle();
      if (error) toast.error(`Load AI config: ${error.message}`);
      else if (data) {
        const r = data as unknown as AiConfigRow;
        setCfg({
          provider: (r.provider as AiProvider) ?? "openai",
          model: r.model ?? "gpt-4o-mini",
          openai_key: r.openai_key ?? "",
          anthropic_key: r.anthropic_key ?? "",
          google_key: r.google_key ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("ai_config" as never).update(cfg as never).eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("AI provider saved");
  };

  const keyType = reveal ? "text" : "password";
  return (
    <Card title="AI Providers (Bring your own keys)">
      {loading ? <div className="text-xs text-slate-400">Loading…</div> : (
        <>
          <F label="Active provider">
            <select value={cfg.provider} onChange={(e) => {
              const p = e.target.value as AiProvider;
              setCfg((c) => ({ ...c, provider: p, model: MODEL_SUGGESTIONS[p][0] }));
            }} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              <option value="openai">OpenAI (ChatGPT)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="google">Google (Gemini)</option>
            </select>
          </F>
          <F label={`Model (${cfg.provider})`}>
            <select value={cfg.model} onChange={(e) => setCfg((c) => ({ ...c, model: e.target.value }))} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              {MODEL_SUGGESTIONS[cfg.provider].map((m) => <option key={m} value={m}>{m}</option>)}
              {!MODEL_SUGGESTIONS[cfg.provider].includes(cfg.model) && <option value={cfg.model}>{cfg.model} (custom)</option>}
            </select>
            <input value={cfg.model} onChange={(e) => setCfg((c) => ({ ...c, model: e.target.value }))} placeholder="Or enter a custom model id" className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono" />
          </F>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} /> Show keys
          </label>
          <F label="OpenAI API key (sk-…)">
            <input type={keyType} value={cfg.openai_key} onChange={(e) => setCfg((c) => ({ ...c, openai_key: e.target.value }))} placeholder="sk-..." className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono" />
          </F>
          <F label="Anthropic API key (sk-ant-…)">
            <input type={keyType} value={cfg.anthropic_key} onChange={(e) => setCfg((c) => ({ ...c, anthropic_key: e.target.value }))} placeholder="sk-ant-..." className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono" />
          </F>
          <F label="Google Gemini API key (AIza…)">
            <input type={keyType} value={cfg.google_key} onChange={(e) => setCfg((c) => ({ ...c, google_key: e.target.value }))} placeholder="AIza..." className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono" />
          </F>
          <div className="text-xs text-slate-400">Keys are stored in an admin-only table (RLS). The active provider powers all AI features: project Ask AI, FAQ, blog writer, and SEO.</div>
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={runTest} disabled={testing} className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200 disabled:opacity-50">{testing ? "Testing…" : "Test AI connection"}</button>
            <button onClick={save} disabled={saving} className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white disabled:opacity-50">{saving ? "Saving…" : "Save AI settings"}</button>
          </div>
          {diag && (
            <div className={`rounded border p-3 text-xs ${diag.ok ? "border-emerald-600 bg-emerald-950/40" : "border-rose-600 bg-rose-950/40"}`}>
              <div className="mb-1 font-semibold">{diag.ok ? "AI is working ✅" : "AI failed ❌ — real reason below"}</div>
              {diag.provider && <div className="text-slate-300">provider: {diag.provider} · model: {diag.model} · key source: {diag.keySource}</div>}
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-slate-300">
                {diag.steps.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
              {diag.error && <pre className="mt-2 whitespace-pre-wrap font-mono text-rose-300">{diag.error}</pre>}
              <div className="mt-2 font-mono text-slate-400">
                Worker env: {Object.entries(diag.env).map(([k, v]) => `${k}=${v ? "set" : "missing"}`).join(" · ")}
              </div>
            </div>
          )}

        </>
      )}
    </Card>
  );
}

function SiteSettings() {
  const { siteSettings, updateSiteSettings } = useApp();
  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold">Site Settings</h1>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="General">
          <F label="Site name"><input value={siteSettings.siteName} onChange={(e) => updateSiteSettings({ siteName: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" /></F>
          <F label="Meta description"><textarea value={siteSettings.metaDescription} onChange={(e) => updateSiteSettings({ metaDescription: e.target.value })} className="min-h-16 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" /></F>
          <F label="Logo upload"><input type="file" className="text-sm" /></F>
          <F label="Favicon upload"><input type="file" className="text-sm" /></F>
        </Card>
        <Card title="Theme Defaults">
          <F label="Default theme">
            <select value={siteSettings.defaultTheme} onChange={(e) => updateSiteSettings({ defaultTheme: e.target.value as never })} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              <option value="light">Light</option><option value="dark">Dark (Retro)</option>
            </select>
          </F>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={siteSettings.allowUserOverride} onChange={(e) => updateSiteSettings({ allowUserOverride: e.target.checked })} /> Allow user override</label>
        </Card>
        <Card title="Feature Flags">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={siteSettings.enableIframe} onChange={(e) => updateSiteSettings({ enableIframe: e.target.checked })} /> Browser Viewport iframe mode</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={siteSettings.enableSubmissions} onChange={(e) => updateSiteSettings({ enableSubmissions: e.target.checked })} /> Enable submissions</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={siteSettings.maintenanceMode} onChange={(e) => updateSiteSettings({ maintenanceMode: e.target.checked })} /> Maintenance mode</label>
        </Card>
        <Card title="Contact">
          <F label="Email"><input value={siteSettings.contactEmail} onChange={(e) => updateSiteSettings({ contactEmail: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" /></F>
          <F label="Company"><input value={siteSettings.contactCompany} onChange={(e) => updateSiteSettings({ contactCompany: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" /></F>
          <F label="Location"><input value={siteSettings.contactLocation} onChange={(e) => updateSiteSettings({ contactLocation: e.target.value })} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" /></F>
        </Card>
        <Card title="Cloudinary (Image Uploads)">
          <F label="Cloud Name">
            <input value={siteSettings.cloudinaryCloudName} placeholder="your-cloud-name"
              onChange={(e) => updateSiteSettings({ cloudinaryCloudName: e.target.value })}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          </F>
          <F label="Upload Preset (Unsigned)">
            <input value={siteSettings.cloudinaryUploadPreset} placeholder="unsigned_preset"
              onChange={(e) => updateSiteSettings({ cloudinaryUploadPreset: e.target.value })}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          </F>
          <div className="text-xs text-slate-400">Create an unsigned upload preset in your Cloudinary dashboard: Settings → Upload → Add upload preset → Signing Mode: Unsigned.</div>
        </Card>
        <Card title="AI Writer">
          <F label="Default AI instruction (system prompt for blog writer)">
            <textarea
              value={siteSettings.aiDefaultInstruction ?? ""}
              onChange={(e) => updateSiteSettings({ aiDefaultInstruction: e.target.value })}
              placeholder="e.g. Write in a friendly, informative tone for the Stellar community. Prefer short paragraphs and concrete examples."
              className="min-h-24 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </F>
          <div className="text-xs text-slate-400">Used as the base system prompt whenever an admin clicks “AI: Write post”.</div>
        </Card>
        <AiProvidersCard />
        <Card title="API Settings">
          <F label="Rate limit (req/min)"><input defaultValue={60} type="number" className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" /></F>
          <div className="text-xs text-slate-400">Issued keys</div>
          <table className="w-full text-xs"><tbody>
            {["xrpb_ab12cd34", "xrpb_ef56gh78"].map((k) => (
              <tr key={k}><td className="py-1 font-mono">{k}</td><td className="text-right"><button onClick={() => toast("Revoked")} className="text-rose-400 hover:underline">Revoke</button></td></tr>
            ))}
          </tbody></table>
        </Card>
        <Card title="Footer Links">
          <div className="text-sm text-slate-300">Manage legal / footer links (mock)</div>
          <ul className="text-xs text-slate-400">
            <li>/about · /privacy · /terms · /help</li>
          </ul>
        </Card>
      </div>
      <button onClick={() => toast.success("Settings saved")} className="mt-4 rounded bg-sky-500 px-4 py-2 text-sm text-white">Save all</button>
    </AdminShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><div className="mb-3 text-sm font-semibold">{title}</div><div className="space-y-3">{children}</div></div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs"><div className="mb-1 text-slate-400">{label}</div>{children}</label>;
}
