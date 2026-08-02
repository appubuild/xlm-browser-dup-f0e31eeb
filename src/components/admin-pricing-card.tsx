import { useState } from "react";
import { toast } from "sonner";
import {
  usePricing, savePricingTier, savePromoSettings, priceLabel,
  type PricingTier, type PromoSettings,
} from "@/lib/pricing";

/** Admin controls for the dynamic pricing engine + free Founder claim mode. */
export function AdminPricingCard({ onlyKeys, title = "Pricing & Founder Membership" }: { onlyKeys?: string[]; title?: string }) {
  const { tiers: allTiers, promo, loading, reload } = usePricing();
  const tiers = onlyKeys ? allTiers.filter((t) => onlyKeys.includes(t.key)) : allTiers;
  const [draft, setDraft] = useState<Record<string, PricingTier>>({});
  const [promoDraft, setPromoDraft] = useState<PromoSettings | null>(null);
  const p = promoDraft ?? promo;


  const patchPromo = (patch: Partial<PromoSettings>) =>
    setPromoDraft({ ...(p ?? { freeFounderClaim: false, claimStartsAt: null, claimEndsAt: null, claimHeadline: "" }), ...patch });

  const savePromo = async () => {
    if (!p) return;
    try { await savePromoSettings(p); setPromoDraft(null); await reload(); toast.success("Promotion settings saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
  };

  const row = (t: PricingTier) => draft[t.id] ?? t;
  const patch = (t: PricingTier, x: Partial<PricingTier>) =>
    setDraft((d) => ({ ...d, [t.id]: { ...row(t), ...x } }));
  const save = async (t: PricingTier) => {
    try { await savePricingTier(row(t)); setDraft((d) => { const n = { ...d }; delete n[t.id]; return n; }); await reload(); toast.success(`${t.name} updated`); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 text-sm font-semibold">Pricing & Founder Membership</div>

      <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950 p-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!p?.freeFounderClaim}
            onChange={(e) => patchPromo({ freeFounderClaim: e.target.checked })} />
          Free Founder Claim Mode (users unlock Founder without paying)
        </label>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block text-xs">
            <div className="mb-1 text-slate-400">Claim window starts</div>
            <input type="datetime-local" value={toLocal(p?.claimStartsAt)}
              onChange={(e) => patchPromo({ claimStartsAt: fromLocal(e.target.value) })}
              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm" />
          </label>
          <label className="block text-xs">
            <div className="mb-1 text-slate-400">Claim window ends</div>
            <input type="datetime-local" value={toLocal(p?.claimEndsAt)}
              onChange={(e) => patchPromo({ claimEndsAt: fromLocal(e.target.value) })}
              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm" />
          </label>
        </div>
        <label className="mt-2 block text-xs">
          <div className="mb-1 text-slate-400">Claim headline shown on /pricing</div>
          <input value={p?.claimHeadline ?? ""} onChange={(e) => patchPromo({ claimHeadline: e.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm" />
        </label>
        <button onClick={savePromo} disabled={!promoDraft}
          className="mt-3 rounded bg-sky-500 px-3 py-1.5 text-xs text-white disabled:opacity-40">Save promotion settings</button>
      </div>

      {loading ? <div className="text-xs text-slate-400">Loading tiers…</div> : (
        <div className="space-y-2">
          {tiers.length === 0 && <div className="text-xs text-slate-400">No pricing tiers yet.</div>}
          {tiers.map((t) => {
            const r = row(t);
            return (
              <div key={t.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input value={r.name} onChange={(e) => patch(t, { name: e.target.value })}
                    className="min-w-40 flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm" />
                  <input type="number" step="0.1" min={0} value={r.priceXrp}
                    onChange={(e) => patch(t, { priceXrp: Number(e.target.value) })}
                    className="w-28 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm" />
                  <span className="text-xs text-slate-400">{priceLabel(r)}</span>
                  <label className="flex items-center gap-1 text-xs text-slate-400">
                    <input type="checkbox" checked={r.active} onChange={(e) => patch(t, { active: e.target.checked })} />
                    Active
                  </label>
                  <label className="flex items-center gap-1 text-xs text-slate-400">
                    <input type="checkbox" checked={r.highlight} onChange={(e) => patch(t, { highlight: e.target.checked })} />
                    Highlight
                  </label>
                  <button onClick={() => save(t)} disabled={!draft[t.id]}
                    className="rounded bg-sky-500 px-3 py-1.5 text-xs text-white disabled:opacity-40">Save</button>
                </div>
                <input value={r.tagline ?? ""} placeholder="Tagline"
                  onChange={(e) => patch(t, { tagline: e.target.value })}
                  className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs" />
                <textarea value={r.features.join("\n")} placeholder="One feature per line"
                  onChange={(e) => patch(t, { features: e.target.value.split("\n").filter(Boolean) })}
                  className="mt-2 min-h-20 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const toLocal = (iso: string | null | undefined) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);
