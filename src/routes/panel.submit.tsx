import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PanelShell } from "@/components/panel-shell";
import { RichEditor } from "@/components/rich-editor";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/submit")({ component: SubmitPage });

function SubmitPage() {
  const { addProject, categories, siteSettings } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const cats = categories.filter((c) => c.visible).sort((a, b) => a.sortOrder - b.sortOrder);
  const [f, setF] = useState({
    name: "", category: cats[0]?.slug ?? "dapps", url: "", tagline: "",
    description: "", aiDoc: "", logo: "🔗",
    twitter: "", discord: "", telegram: "", github: "",
    supportEmail: "", terms: false,
  });
  const upd = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const hasSocial = !!(f.twitter || f.discord || f.telegram || f.github);
  const descPlain = f.description.replace(/<[^>]*>/g, "").trim();
  const step1Valid = f.name.trim() && f.category && /^https?:\/\//i.test(f.url) && f.tagline.trim();
  const step2Valid = descPlain.length >= 20 && hasSocial;
  const step3Valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.supportEmail) && f.terms;

  const canSubmit = step1Valid && step2Valid && step3Valid;

  if (done) {
    return (
      <PanelShell>
        <div className="mx-auto max-w-md p-10 text-center">
          <div className="text-5xl">✅</div>
          <h1 className="mt-3 text-2xl font-bold">Submitted for Review</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            An admin will review your submission. Once approved
            {siteSettings.listingFeeXrp > 0 ? `, you'll pay the ${siteSettings.listingFeeXrp} XRP listing fee to publish.` : ", it will be published automatically."}
          </p>
          <button onClick={() => nav({ to: "/panel/submissions" })} className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">View my submissions</button>
        </div>
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-3xl font-bold">Submit a Project</h1>
        <p className="mt-1 text-sm text-muted-foreground">Get your XRPL project listed on XRPBrowser. All fields are required.</p>

        <div className="mt-6 flex items-center gap-2 text-sm">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`flex items-center gap-2 ${step === n ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-full border ${step >= n ? "border-primary bg-primary text-primary-foreground" : ""}`}>{n}</span>
              {["Basic", "Details & Docs", "Contact & Review"][n - 1]}
              {n < 3 && <span className="opacity-40">—</span>}
            </div>
          ))}
        </div>

        <div className="soft-card mt-6 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Project name *"><input value={f.name} onChange={(e) => upd("name", e.target.value)} required className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
              <Field label="Category *">
                <select value={f.category} onChange={(e) => upd("category", e.target.value)} required className="w-full rounded border bg-background px-3 py-2 text-sm">
                  {cats.map((c) => <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>)}
                </select>
              </Field>
              <Field label="Website URL *"><input value={f.url} onChange={(e) => upd("url", e.target.value)} placeholder="https://" required className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
              <Field label="One-line tagline *"><input value={f.tagline} onChange={(e) => upd("tagline", e.target.value)} required maxLength={140} className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
              <Field label="Logo (emoji or URL) *"><input value={f.logo} onChange={(e) => upd("logo", e.target.value)} required className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <Field label="Full description * (rich text)">
                <RichEditor value={f.description} onChange={(v) => upd("description", v)} placeholder="Describe your project, features, and value…" minHeight={180} />
                <div className="mt-1 text-xs text-muted-foreground">{descPlain.length} chars (min 20)</div>
              </Field>
              <Field label="AI documentation (public users can ask AI questions using this)">
                <RichEditor value={f.aiDoc} onChange={(v) => upd("aiDoc", v)} placeholder="Paste docs, FAQs, how-tos, tokenomics… the AI answers based on this." minHeight={180} />
              </Field>
              <div>
                <div className="mb-2 text-xs font-medium">Social links * (at least one required)</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Twitter / X"><input value={f.twitter} onChange={(e) => upd("twitter", e.target.value)} placeholder="https://x.com/…" className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
                  <Field label="Discord"><input value={f.discord} onChange={(e) => upd("discord", e.target.value)} placeholder="https://discord.gg/…" className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
                  <Field label="Telegram"><input value={f.telegram} onChange={(e) => upd("telegram", e.target.value)} placeholder="https://t.me/…" className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
                  <Field label="GitHub"><input value={f.github} onChange={(e) => upd("github", e.target.value)} placeholder="https://github.com/…" className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
                </div>
                {!hasSocial && <div className="mt-1 text-xs text-destructive">Add at least one social link.</div>}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <Field label="Support email *"><input type="email" value={f.supportEmail} onChange={(e) => upd("supportEmail", e.target.value)} required placeholder="support@yourproject.com" className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
              <div className="rounded-md bg-muted p-3 text-sm">
                <div><b>Name:</b> {f.name}</div>
                <div><b>Category:</b> {f.category}</div>
                <div><b>URL:</b> {f.url}</div>
                <div><b>Tagline:</b> {f.tagline}</div>
                <div><b>Socials:</b> {[f.twitter && "X", f.discord && "Discord", f.telegram && "Telegram", f.github && "GitHub"].filter(Boolean).join(", ") || "—"}</div>
              </div>
              {siteSettings.listingFeeXrp > 0 ? (
                <div className="rounded border border-primary/30 bg-primary/5 p-3 text-sm">
                  <b>Listing fee: {siteSettings.listingFeeXrp} XRP.</b> Payment required <i>after</i> admin approval to publish your listing.
                </div>
              ) : (
                <div className="rounded border border-success/30 bg-success/5 p-3 text-sm">
                  <b>Free listing.</b> Once approved by an admin, your project will be published automatically.
                </div>
              )}
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.terms} onChange={(e) => upd("terms", e.target.checked)} /> I agree to the Terms of Service *</label>
            </div>
          )}
          <div className="mt-6 flex justify-between">
            <button disabled={step === 1} onClick={() => setStep((s) => s - 1)} className="rounded border px-4 py-2 text-sm disabled:opacity-50">Back</button>
            {step < 3 ? (
              <button
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                onClick={() => setStep((s) => s + 1)}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >Next</button>
            ) : (
              <button
                disabled={!canSubmit || submitting}
                onClick={async () => {
                  setSubmitting(true);
                  const res = await addProject({
                    name: f.name.trim(), category: f.category, url: f.url.trim(), tagline: f.tagline.trim(),
                    description: f.description, aiDoc: f.aiDoc, logo: f.logo,
                    socials: { twitter: f.twitter, discord: f.discord, telegram: f.telegram, github: f.github },
                    supportEmail: f.supportEmail.trim(),
                    slug: f.name.toLowerCase().replace(/\s+/g, "-"),
                    screenshots: [],
                  });
                  setSubmitting(false);
                  if (!res) { toast.error("Submission failed"); return; }
                  toast.success("Submitted for review");
                  setDone(true);
                }}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >{submitting ? "Submitting…" : "Submit"}</button>
            )}
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1 text-xs font-medium">{label}</div>{children}</label>;
}
