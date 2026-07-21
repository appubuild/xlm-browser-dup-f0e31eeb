import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";
import { CATEGORIES, type ProjectCategory } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/submit")({ component: SubmitPage });

function SubmitPage() {
  const { addProject } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [f, setF] = useState({
    name: "", category: "dapps" as ProjectCategory, url: "", tagline: "",
    description: "", logo: "🔗",
    twitter: "", discord: "", telegram: "", github: "",
    submitterName: "", submitterEmail: "", terms: false,
  });
  const upd = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  if (done) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-md p-10 text-center">
          <div className="text-5xl">✅</div>
          <h1 className="mt-3 text-2xl font-bold">Submitted for Review</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your project has been added to the moderation queue. You'll be notified at <b>{f.submitterEmail}</b> once reviewed.</p>
          <button onClick={() => nav({ to: "/panel/submissions" })} className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">View my submissions</button>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-bold">Submit a Project</h1>
        <p className="mt-1 text-sm text-muted-foreground">Get your XRPL project listed on XRPBrowser.</p>

        <div className="mt-6 flex items-center gap-2 text-sm">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`flex items-center gap-2 ${step === n ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-full border ${step >= n ? "border-primary bg-primary text-primary-foreground" : ""}`}>{n}</span>
              {["Basic", "Details", "Review"][n - 1]}
              {n < 3 && <span className="opacity-40">—</span>}
            </div>
          ))}
        </div>

        <div className="soft-card mt-6 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Project name"><input value={f.name} onChange={(e) => upd("name", e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
              <Field label="Category">
                <select value={f.category} onChange={(e) => upd("category", e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm">
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Website URL"><input value={f.url} onChange={(e) => upd("url", e.target.value)} placeholder="https://" className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
              <Field label="One-line tagline"><input value={f.tagline} onChange={(e) => upd("tagline", e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <Field label="Full description"><textarea value={f.description} onChange={(e) => upd("description", e.target.value)} className="min-h-24 w-full rounded border bg-background p-2 text-sm" /></Field>
              <Field label="Logo (emoji or URL)"><input value={f.logo} onChange={(e) => upd("logo", e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
              <Field label="Screenshot (mock)"><input type="file" className="w-full text-sm" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Twitter"><input value={f.twitter} onChange={(e) => upd("twitter", e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
                <Field label="Discord"><input value={f.discord} onChange={(e) => upd("discord", e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
                <Field label="Telegram"><input value={f.telegram} onChange={(e) => upd("telegram", e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
                <Field label="GitHub"><input value={f.github} onChange={(e) => upd("github", e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <Field label="Your name"><input value={f.submitterName} onChange={(e) => upd("submitterName", e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
              <Field label="Your email"><input value={f.submitterEmail} onChange={(e) => upd("submitterEmail", e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" /></Field>
              <div className="rounded-md bg-muted p-3 text-sm">
                <div><b>Name:</b> {f.name}</div>
                <div><b>Category:</b> {f.category}</div>
                <div><b>URL:</b> {f.url}</div>
                <div><b>Tagline:</b> {f.tagline}</div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.terms} onChange={(e) => upd("terms", e.target.checked)} /> I agree to the Terms of Service</label>
            </div>
          )}
          <div className="mt-6 flex justify-between">
            <button disabled={step === 1} onClick={() => setStep((s) => s - 1)} className="rounded border px-4 py-2 text-sm disabled:opacity-50">Back</button>
            {step < 3 ? (
              <button onClick={() => setStep((s) => s + 1)} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Next</button>
            ) : (
              <button
                disabled={!f.terms || !f.name || !f.submitterEmail}
                onClick={() => {
                  addProject({
                    name: f.name, category: f.category, url: f.url, tagline: f.tagline,
                    description: f.description, logo: f.logo,
                    socials: { twitter: f.twitter, discord: f.discord, telegram: f.telegram, github: f.github },
                    submitterName: f.submitterName, submitterEmail: f.submitterEmail,
                    slug: f.name.toLowerCase().replace(/\s+/g, "-"),
                    screenshots: [],
                  });
                  toast.success("Submitted for review");
                  setDone(true);
                }}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >Submit</button>
            )}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1 text-xs font-medium">{label}</div>{children}</label>;
}
