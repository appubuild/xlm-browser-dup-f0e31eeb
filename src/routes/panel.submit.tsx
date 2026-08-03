import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PanelShell } from "@/components/panel-shell";
import { RichEditor } from "@/components/rich-editor";
import { useApp } from "@/lib/app-store";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { FounderCta } from "@/components/founder-gate";
import { usePricing, useFounder, FOUNDER_KEY } from "@/lib/pricing";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/submit")({ component: SubmitGate });

/** Only Founder Members (and admins) may submit projects. */
function SubmitGate() {
  const { user, isAdmin } = useApp();
  const { tiers, promo } = usePricing();
  const { isFounder, loading, reload } = useFounder(user?.id, isAdmin);
  const founderTier = tiers.find((t) => t.key === FOUNDER_KEY);

  if (loading) {
    return <PanelShell><div className="px-6 py-16 text-sm text-muted-foreground">Checking your membership…</div></PanelShell>;
  }
  if (isFounder) return <SubmitPage />;

  return (
    <PanelShell>
      <div className="mx-auto max-w-xl px-6 py-14">
        <div className="soft-card p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-400/15 text-3xl">★</div>
          <h1 className="mt-4 text-2xl font-bold">Founder Membership required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Submitting projects to XLM Browser is reserved for Founder Members. Unlock it once and keep it forever —
            you also get the Founder badge, full dashboard access and project analytics.
          </p>
          <ul className="mx-auto mt-4 max-w-sm space-y-1.5 text-left text-sm">
            {(founderTier?.features ?? ["Submit unlimited projects", "Founder badge", "Dashboard & analytics"]).map((f) => (
              <li key={f} className="flex gap-2"><span className="text-primary">✓</span><span>{f}</span></li>
            ))}
          </ul>
          <div className="mx-auto mt-6 max-w-xs">
            <FounderCta tier={founderTier} promo={promo} onGranted={reload} />
          </div>
          <Link to="/pricing" className="mt-4 inline-block text-xs text-muted-foreground underline">See all plans</Link>
        </div>
      </div>
    </PanelShell>
  );
}


type SocialPlatform =
  | "twitter" | "discord" | "telegram" | "github" | "facebook" | "instagram"
  | "youtube" | "linkedin" | "tiktok" | "reddit" | "medium" | "website" | "other";

const SOCIAL_OPTIONS: { value: SocialPlatform; label: string; icon: string; placeholder: string }[] = [
  { value: "twitter",   label: "Twitter / X", icon: "𝕏",  placeholder: "https://x.com/…" },
  { value: "discord",   label: "Discord",     icon: "💬", placeholder: "https://discord.gg/…" },
  { value: "telegram",  label: "Telegram",    icon: "✈️", placeholder: "https://t.me/…" },
  { value: "github",    label: "GitHub",      icon: "🐙", placeholder: "https://github.com/…" },
  { value: "facebook",  label: "Facebook",    icon: "📘", placeholder: "https://facebook.com/…" },
  { value: "instagram", label: "Instagram",   icon: "📸", placeholder: "https://instagram.com/…" },
  { value: "youtube",   label: "YouTube",     icon: "▶️", placeholder: "https://youtube.com/@…" },
  { value: "linkedin",  label: "LinkedIn",    icon: "💼", placeholder: "https://linkedin.com/company/…" },
  { value: "tiktok",    label: "TikTok",      icon: "🎵", placeholder: "https://tiktok.com/@…" },
  { value: "reddit",    label: "Reddit",      icon: "👽", placeholder: "https://reddit.com/r/…" },
  { value: "medium",    label: "Medium",      icon: "✍️", placeholder: "https://medium.com/@…" },
  { value: "website",   label: "Website",     icon: "🌐", placeholder: "https://…" },
  { value: "other",     label: "Other",       icon: "🔗", placeholder: "https://…" },
];

interface SocialRow { key: string; platform: SocialPlatform; url: string }

function SubmitPage() {
  const { addProject, categories, siteSettings, user } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState<{ name: string } | null>(null);
  const cats = categories.filter((c) => c.visible).sort((a, b) => a.sortOrder - b.sortOrder);

  const [f, setF] = useState({
    name: "", category: cats[0]?.slug ?? "dapps", url: "", tagline: "",
    description: "", aiDoc: "",
    logo: "🔗", logoMode: "emoji" as "emoji" | "url" | "upload",
    supportEmail: "", terms: false,
  });
  const [socials, setSocials] = useState<SocialRow[]>([
    { key: crypto.randomUUID(), platform: "twitter", url: "" },
  ]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upd = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const validSocials = socials.filter((s) => s.url.trim() && /^https?:\/\//i.test(s.url.trim()));
  const hasSocial = validSocials.length > 0;
  const descPlain = f.description.replace(/<[^>]*>/g, "").trim();
  const logoValid = f.logoMode === "emoji"
    ? !!f.logo.trim()
    : /^https?:\/\//i.test(f.logo.trim());
  const step1Valid = f.name.trim() && f.category && /^https?:\/\//i.test(f.url) && f.tagline.trim() && logoValid;
  const step2Valid = descPlain.length >= 20 && hasSocial;
  const step3Valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.supportEmail) && f.terms;
  const canSubmit = step1Valid && step2Valid && step3Valid;

  const addSocial = () => {
    const used = new Set(socials.map((s) => s.platform));
    const next = SOCIAL_OPTIONS.find((o) => !used.has(o.value)) ?? SOCIAL_OPTIONS[SOCIAL_OPTIONS.length - 1];
    setSocials((s) => [...s, { key: crypto.randomUUID(), platform: next.value, url: "" }]);
  };
  const removeSocial = (key: string) => setSocials((s) => (s.length > 1 ? s.filter((x) => x.key !== key) : s));
  const updateSocial = (key: string, patch: Partial<SocialRow>) =>
    setSocials((s) => s.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const handleUpload = async (file: File) => {
    if (!siteSettings.cloudinaryCloudName || !siteSettings.cloudinaryUploadPreset) {
      toast.error("Image uploads aren't configured. Use a URL or emoji, or contact an admin.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, siteSettings.cloudinaryCloudName, siteSettings.cloudinaryUploadPreset);
      upd("logo", url);
      upd("logoMode", "upload");
      toast.success("Logo uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (done && submitted) {
    return (
      <PanelShell>
        <div className="mx-auto max-w-xl px-6 py-16">
          <div className="soft-card overflow-hidden text-center">
            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-8 pt-10">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/15 text-4xl shadow-inner">🎉</div>
              <h1 className="mt-4 text-2xl font-bold">Thanks, {user?.name?.split(" ")[0] || "friend"}!</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                <b className="text-foreground">{submitted.name}</b> was submitted successfully and is now in the review queue.
              </p>
            </div>
            <div className="space-y-4 px-8 py-6 text-left text-sm">
              <Step icon="🔍" title="Admin review" desc="Our team will look over your submission within 24–48 hours." />
              <Step icon={siteSettings.listingFeeXlm > 0 ? "💳" : "🚀"}
                title={siteSettings.listingFeeXlm > 0 ? `Pay listing fee (${siteSettings.listingFeeXlm} XLM)` : "Auto-publish"}
                desc={siteSettings.listingFeeXlm > 0
                  ? "Once approved, complete payment from “My Submissions” to go live."
                  : "Once approved, your project will be published automatically."} />
              <Step icon="📣" title="You'll be notified" desc="Watch your inbox and the Notifications tab for updates." />
            </div>
            <div className="flex flex-col gap-2 border-t border-border/60 px-8 py-5 sm:flex-row">
              <button onClick={() => nav({ to: "/panel/submissions" })}
                className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                View my submissions
              </button>
              <Link to="/" className="flex-1 rounded-md border px-4 py-2.5 text-center text-sm hover:bg-accent">
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-3xl font-bold">Submit a Project</h1>
        <p className="mt-1 text-sm text-muted-foreground">Get your Stellar project listed on XLM Browser. All fields are required.</p>

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

              <div>
                <div className="mb-1 text-xs font-medium">Logo *</div>
                <div className="mb-2 flex gap-1 rounded-md border bg-muted p-1 text-xs">
                  {(["emoji", "url", "upload"] as const).map((m) => (
                    <button type="button" key={m}
                      onClick={() => { upd("logoMode", m); upd("logo", m === "emoji" ? "🔗" : ""); }}
                      className={`flex-1 rounded px-2 py-1.5 ${f.logoMode === m ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}>
                      {m === "emoji" ? "Emoji" : m === "url" ? "Image URL" : "Upload"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted text-2xl">
                    {/^https?:\/\//i.test(f.logo) ? <img src={f.logo} alt="" className="h-full w-full object-cover" /> : <span>{f.logo || "🔗"}</span>}
                  </div>
                  {f.logoMode === "emoji" && (
                    <input value={f.logo} onChange={(e) => upd("logo", e.target.value)} placeholder="🚀" className="w-full rounded border bg-background px-3 py-2 text-sm" />
                  )}
                  {f.logoMode === "url" && (
                    <input value={f.logo} onChange={(e) => upd("logo", e.target.value)} placeholder="https://…/logo.png" className="w-full rounded border bg-background px-3 py-2 text-sm" />
                  )}
                  {f.logoMode === "upload" && (
                    <div className="flex-1 space-y-1">
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleUpload(file); }} />
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="rounded border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50">
                        {uploading ? "Uploading…" : f.logo ? "Replace image" : "Choose image"}
                      </button>
                      {!siteSettings.cloudinaryCloudName && (
                        <div className="text-xs text-amber-500">Uploads not configured — use URL or emoji.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-medium">Social links * (at least one required)</div>
                  <button type="button" onClick={addSocial} className="rounded border px-2.5 py-1 text-xs hover:bg-accent">+ Add social</button>
                </div>
                <div className="space-y-2">
                  {socials.map((row) => {
                    const opt = SOCIAL_OPTIONS.find((o) => o.value === row.platform) ?? SOCIAL_OPTIONS[0];
                    return (
                      <div key={row.key} className="flex gap-2">
                        <select value={row.platform} onChange={(e) => updateSocial(row.key, { platform: e.target.value as SocialPlatform })}
                          className="w-40 rounded border bg-background px-2 py-2 text-sm">
                          {SOCIAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.icon} {o.label}</option>)}
                        </select>
                        <input value={row.url} onChange={(e) => updateSocial(row.key, { url: e.target.value })}
                          placeholder={opt.placeholder} className="flex-1 rounded border bg-background px-3 py-2 text-sm" />
                        <button type="button" onClick={() => removeSocial(row.key)} disabled={socials.length === 1}
                          className="rounded border px-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40" aria-label="Remove">✕</button>
                      </div>
                    );
                  })}
                </div>
                {!hasSocial && <div className="mt-1 text-xs text-destructive">Add at least one valid social link (starting with http/https).</div>}
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
                <div><b>Socials:</b> {validSocials.map((s) => SOCIAL_OPTIONS.find((o) => o.value === s.platform)?.label || s.platform).join(", ") || "—"}</div>
              </div>
              {siteSettings.listingFeeXlm > 0 ? (
                <div className="rounded border border-primary/30 bg-primary/5 p-3 text-sm">
                  <b>Listing fee: <XlmAmount xlm={siteSettings.listingFeeXlm} inline /></b> Payment required <i>after</i> admin approval to publish your listing.
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
                  const socialsObj: Record<string, string> = {};
                  for (const s of validSocials) socialsObj[s.platform] = s.url.trim();
                  const res = await addProject({
                    name: f.name.trim(), category: f.category, url: f.url.trim(), tagline: f.tagline.trim(),
                    description: f.description, aiDoc: f.aiDoc, logo: f.logo,
                    socials: socialsObj,
                    supportEmail: f.supportEmail.trim(),
                    slug: f.name.toLowerCase().replace(/\s+/g, "-"),
                    screenshots: [],
                  });
                  setSubmitting(false);
                  if (!res) { toast.error("Submission failed"); return; }
                  setSubmitted({ name: f.name.trim() });
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

function Step({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-lg">{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
