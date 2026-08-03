import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PanelShell } from "@/components/panel-shell";
import { useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { StellarPayDialog } from "@/components/stellar-pay-dialog";
import {
  fetchBadgeTiers, fetchMyAuthorProfile, upsertAuthorProfile, purchaseBadge, findCompanyConflict,
  type AuthorProfile, type BadgeTier, type SocialLink, type DuplicateField,
} from "@/lib/monetization";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import { FounderGuard } from "@/components/founder-guard";

export const Route = createFileRoute("/panel/company")({
  component: CompanyProfilePage,
  head: () => ({
    meta: [
      { title: "Author & Company Profile — XLM Browser" },
      { name: "description", content: "Manage your Stellar company profile and buy a lifetime verification badge for all your listed projects." },
      { property: "og:title", content: "Author & Company Profile — XLM Browser" },
      { property: "og:description", content: "Manage your Stellar company profile and lifetime verification badge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const PLATFORMS = ["Website", "X (Twitter)", "Discord", "Telegram", "GitHub", "LinkedIn", "YouTube", "Medium", "Reddit", "Instagram", "Facebook", "TikTok"];

const TIER_COLORS: Record<string, string> = {
  sky: "border-sky-500/50 bg-sky-500/5",
  violet: "border-violet-500/50 bg-violet-500/5",
  amber: "border-amber-500/50 bg-amber-500/5",
};

function CompanyProfilePage() {
  const { user } = useApp();
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [tiers, setTiers] = useState<BadgeTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buying, setBuying] = useState<BadgeTier | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateField | null>(null);

  const [form, setForm] = useState({
    companyName: "", logo: "", bio: "", officialEmail: "", website: "",
    socials: [] as SocialLink[],
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [p, t] = await Promise.all([fetchMyAuthorProfile(user.id), fetchBadgeTiers()]);
      setTiers(t);
      setProfile(p);
      if (p) setForm({
        companyName: p.companyName, logo: p.logo ?? "", bio: p.bio ?? "",
        officialEmail: p.officialEmail ?? "", website: p.website ?? "", socials: p.socials,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load your company profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!user) return;
    if (!form.companyName.trim()) return toast.error("Company name is required");
    if (form.socials.some((s) => !s.url.trim())) return toast.error("Every social link needs a URL");
    setSaving(true);
    try {
      const conflict = await findCompanyConflict(user.id, form.companyName, form.officialEmail);
      if (conflict) { setDuplicate(conflict); return; }
      const next = await upsertAuthorProfile(user.id, {
        companyName: form.companyName.trim(),
        logo: form.logo.trim(),
        bio: form.bio.trim(),
        officialEmail: form.officialEmail.trim(),
        website: form.website.trim(),
        socials: form.socials,
      });
      setProfile(next);
      toast.success("Company profile saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      if (/duplicate key|unique constraint/i.test(msg)) {
        setDuplicate(/official_email/i.test(msg) ? "email" : "name");
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const currentTier = tiers.find((t) => t.key === profile?.badgeTier) ?? null;

  return (
    <PanelShell>
      <FounderGuard feature="The Author / Company Profile">
      <div className="max-w-4xl p-6">
        <h1 className="text-2xl font-bold">Author / Company Profile</h1>
        <p className="text-sm text-muted-foreground">One company profile owns all the projects you submit.</p>

        {loading ? (
          <div className="soft-card mt-6 p-10 text-center text-muted-foreground">Loading…</div>
        ) : (
          <>
            <section className="soft-card mt-6 space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Company details</div>
                {currentTier && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    ✓ {currentTier.name} — lifetime
                  </span>
                )}
              </div>
              <Field label="Company name *">
                <input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} className="inp" placeholder="Acme Labs" />
              </Field>
              <Field label="Logo (emoji or image URL)">
                <input value={form.logo} onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))} className="inp" placeholder="🏢 or https://…" />
              </Field>
              <Field label="Bio">
                <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className="inp min-h-24" placeholder="What does your company build on the Stellar Network?" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Official email">
                  <input value={form.officialEmail} onChange={(e) => setForm((f) => ({ ...f, officialEmail: e.target.value }))} className="inp" placeholder="hello@acme.xyz" />
                </Field>
                <Field label="Website">
                  <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="inp" placeholder="https://acme.xyz" />
                </Field>
              </div>

              <div>
                <div className="mb-1 text-xs text-muted-foreground">Social links</div>
                <div className="space-y-2">
                  {form.socials.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <select value={s.platform} onChange={(e) => setForm((f) => ({ ...f, socials: f.socials.map((x, j) => j === i ? { ...x, platform: e.target.value } : x) }))} className="inp w-40">
                        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input value={s.url} onChange={(e) => setForm((f) => ({ ...f, socials: f.socials.map((x, j) => j === i ? { ...x, url: e.target.value } : x) }))} className="inp flex-1" placeholder="https://…" />
                      <button onClick={() => setForm((f) => ({ ...f, socials: f.socials.filter((_, j) => j !== i) }))} className="rounded border px-2 text-sm hover:bg-accent">✕</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setForm((f) => ({ ...f, socials: [...f.socials, { platform: PLATFORMS[1], url: "" }] }))} className="mt-2 rounded border px-3 py-1.5 text-xs hover:bg-accent">+ Add social link</button>
              </div>

              <button onClick={save} disabled={saving} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
                {saving ? "Saving…" : profile ? "Update profile" : "Create profile"}
              </button>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold">Lifetime verification badges</h2>
              <p className="text-sm text-muted-foreground">Pay once with your Freighter wallet — the badge never expires and applies to every project you list.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {tiers.map((t) => {
                  const owned = profile?.badgeTier === t.key;
                  return (
                    <div key={t.id} className={`rounded-xl border p-5 ${TIER_COLORS[t.color] ?? "border-border"}`}>
                      <div className="text-sm font-semibold uppercase tracking-wider">{t.name}</div>
                      <div className="mt-1 text-3xl font-bold">{t.priceXlm} <span className="text-base font-normal text-muted-foreground">XLM</span></div>
                      <div className="text-xs text-muted-foreground">one-time · lifetime</div>
                      <ul className="mt-3 space-y-1.5 text-sm">
                        {t.benefits.map((b) => <li key={b} className="flex gap-2"><span className="text-primary">✓</span><span>{b}</span></li>)}
                      </ul>
                      <button
                        disabled={owned || !profile}
                        onClick={() => setBuying(t)}
                        className="mt-4 w-full rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
                      >
                        {owned ? "Current badge" : !profile ? "Create profile first" : `Buy for ${t.priceXlm} XLM`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
      </FounderGuard>

      <Dialog open={!!duplicate} onOpenChange={(o) => !o && setDuplicate(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Company already registered</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            This company profile already exists in our system
            {duplicate === "email" ? " with that support email" : " under that company name"}.
            Please try another {duplicate === "email" ? "email" : "name"} — or log in with the account that owns this
            company to join it.
          </p>
          <DialogFooter>
            <Link to="/login" className="rounded border px-4 py-2 text-sm hover:bg-accent">Log in to join</Link>
            <button onClick={() => setDuplicate(null)} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Try another</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StellarPayDialog
        open={!!buying}
        title={`Buy ${buying?.name ?? ""} badge`}
        subtitle="Lifetime verification for your company and all its listed projects."
        amountXlm={buying?.priceXlm ?? 0}
        memo={`XLM Browser ${buying?.name ?? ""} lifetime badge`}
        onClose={() => setBuying(null)}
        onPaid={async (txHash, account) => {
          if (!user || !buying) return;
          try {
            await purchaseBadge(user.id, buying, txHash, account);
            toast.success(`${buying.name} badge activated`);
            setBuying(null);
            await load();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not activate the badge");
          }
        }}
      />
    </PanelShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm"><div className="mb-1 text-xs text-muted-foreground">{label}</div>{children}</label>;
}
