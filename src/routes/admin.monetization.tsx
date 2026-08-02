import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "sonner";
import {
  fetchBadgeTiers, saveBadgeTier, createBadgeTier, deleteBadgeTier,
  fetchPromotionPackages, savePromotionPackage, createPromotionPackage, deletePromotionPackage,
  fetchAllPromotions, setPromotionStatus, extendPromotion,
  fetchAllAuthorProfiles, setAuthorBadge, fetchAllTransactions, setCompanyFeatured, setAuthorVerified,
  SLOT_LABEL, type BadgeTier, type PromotionPackage, type ProjectPromotion,
  type AuthorProfile, type TxRecord, type PromoSlot,
} from "@/lib/monetization";

import { AdminPricingCard } from "@/components/admin-pricing-card";
import { useApp } from "@/lib/app-store";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/monetization")({ component: Monetization });

const TABS = ["Pricing", "Promotions", "Companies", "Transactions"] as const;
type Tab = (typeof TABS)[number];

function Monetization() {
  const [tab, setTab] = useState<Tab>("Pricing");
  return (
    <AdminShell>
      <h1 className="text-xl font-semibold sm:text-2xl">Monetization</h1>
      <p className="text-sm opacity-70">One place for package pricing, promotions, company badges and payment logs.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded px-3 py-1.5 text-sm ${tab === t ? "bg-sky-500 text-white" : "border border-current/20 opacity-70 hover:opacity-100"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tab === "Pricing" && <PricingTab />}
        {tab === "Promotions" && <PromotionsTab />}
        {tab === "Companies" && <CompaniesTab />}
        {tab === "Transactions" && <TransactionsTab />}
      </div>
    </AdminShell>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-current/15 p-4">
      <div className="mb-3 flex items-center justify-between"><div className="text-sm font-semibold">{title}</div>{action}</div>
      {children}
    </div>
  );
}

const inp = "rounded border border-current/25 bg-transparent px-2 py-1.5 text-sm";

/* ------------------------------------------------------------- pricing */

function PricingTab() {
  return (
    <div className="space-y-4">
      <AdminPricingCard />
      <p className="text-xs opacity-60">
        This is the only place package prices are configured. Every change here is used instantly on the public pricing
        page, checkout dialogs and promotional banners.
      </p>
    </div>
  );
}

function PackagesPanel() {
  const [pkgs, setPkgs] = useState<PromotionPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPkgs(await fetchPromotionPackages(true)); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <Panel title="Promotion packages" action={
      <button onClick={async () => {
        try {
          await createPromotionPackage({ slot: "home", durationDays: 7, priceXrp: 0, active: true, sortOrder: pkgs.length + 1 });
          await load();
        } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
      }} className="rounded border border-current/25 px-2 py-1 text-xs">+ Add package</button>
    }>
      {loading ? <div className="text-sm opacity-70">Loading…</div> : (
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs opacity-70"><tr><th className="pb-2">Section</th><th className="pb-2">Days</th><th className="pb-2">XRP</th><th className="pb-2">Active</th><th></th></tr></thead>
            <tbody>
              {pkgs.map((p) => (
                <tr key={p.id} className="border-t border-current/10">
                  <td className="py-2 pr-2">
                    <select value={p.slot} onChange={(e) => setPkgs((s) => s.map((x) => x.id === p.id ? { ...x, slot: e.target.value as PromoSlot } : x))} className={`${inp} w-40`}>
                      {(Object.keys(SLOT_LABEL) as PromoSlot[]).map((k) => <option key={k} value={k}>{SLOT_LABEL[k]}</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-2"><input type="number" value={p.durationDays} onChange={(e) => setPkgs((s) => s.map((x) => x.id === p.id ? { ...x, durationDays: parseInt(e.target.value) || 1 } : x))} className={`${inp} w-20`} /></td>
                  <td className="py-2 pr-2"><input type="number" step="0.1" value={p.priceXrp} onChange={(e) => setPkgs((s) => s.map((x) => x.id === p.id ? { ...x, priceXrp: parseFloat(e.target.value) || 0 } : x))} className={`${inp} w-24`} /></td>
                  <td className="py-2 pr-2"><input type="checkbox" checked={p.active} onChange={(e) => setPkgs((s) => s.map((x) => x.id === p.id ? { ...x, active: e.target.checked } : x))} /></td>
                  <td className="py-2 whitespace-nowrap text-right">
                    <button onClick={async () => { try { await savePromotionPackage(p); toast.success("Saved"); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }} className="rounded bg-sky-500 px-2 py-1 text-xs text-white">Save</button>
                    <button onClick={async () => { if (!confirm("Delete package?")) return; try { await deletePromotionPackage(p.id); await load(); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }} className="ml-1 rounded border border-rose-500/50 px-2 py-1 text-xs text-rose-400">Del</button>
                  </td>
                </tr>
              ))}
              {pkgs.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-sm opacity-60">No packages yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}


/* ---------------------------------------------------------- promotions */

function PromotionsTab() {
  const [rows, setRows] = useState<ProjectPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await fetchAllPromotions()); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const act = async (fn: () => Promise<void>, msg: string) => {
    try { await fn(); toast.success(msg); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  if (loading) return <div className="text-sm opacity-70">Loading…</div>;
  return (
    <Panel title={`Project promotions (${rows.length})`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs opacity-70">
            <tr><th className="pb-2">Project</th><th className="pb-2">Section</th><th className="pb-2">Days</th><th className="pb-2">Paid</th><th className="pb-2">Tx</th><th className="pb-2">Status</th><th className="pb-2">Ends</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-current/10">
                <td className="py-2 font-medium">{r.projectSlug}</td>
                <td className="py-2">{SLOT_LABEL[r.slot] ?? r.slot}</td>
                <td className="py-2">{r.durationDays}</td>
                <td className="py-2">{r.amountXrp} XRP</td>
                <td className="py-2 font-mono text-xs">{r.txHash ? `${r.txHash.slice(0, 8)}…` : "—"}</td>
                <td className="py-2 capitalize">{r.status}</td>
                <td className="py-2 text-xs opacity-70">{r.endsAt ? new Date(r.endsAt).toLocaleDateString() : "—"}</td>
                <td className="py-2 text-right whitespace-nowrap">
                  {r.status !== "active" && <button onClick={() => act(() => setPromotionStatus(r.id, "active"), "Approved")} className="rounded bg-emerald-500 px-2 py-1 text-xs text-white">Approve</button>}
                  <button onClick={() => act(() => extendPromotion(r.id, 7), "Extended 7 days")} className="ml-1 rounded border border-current/25 px-2 py-1 text-xs">+7d</button>
                  {r.status === "active" && <button onClick={() => act(() => setPromotionStatus(r.id, "revoked"), "Revoked")} className="ml-1 rounded border border-rose-500/50 px-2 py-1 text-xs text-rose-400">Revoke</button>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-sm opacity-60">No promotions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------- transactions */

function TransactionsTab() {
  const [rows, setRows] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void (async () => {
      try { setRows(await fetchAllTransactions()); }
      catch (e) { toast.error(e instanceof Error ? e.message : "Load failed"); }
      finally { setLoading(false); }
    })();
  }, []);
  if (loading) return <div className="text-sm opacity-70">Loading…</div>;
  const total = rows.filter((r) => r.status === "success").reduce((a, r) => a + r.amountXrp, 0);
  return (
    <Panel title={`All transactions (${rows.length}) — ${total} XRP collected`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs opacity-70"><tr><th className="pb-2">Date</th><th className="pb-2">Type</th><th className="pb-2">Description</th><th className="pb-2">Amount</th><th className="pb-2">Tx hash</th><th className="pb-2">Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-current/10">
                <td className="py-2 text-xs opacity-70">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="py-2 capitalize">{r.kind}</td>
                <td className="py-2">{r.description ?? "—"}</td>
                <td className="py-2">{r.amountXrp} XRP</td>
                <td className="py-2">{r.txHash ? <a className="font-mono text-xs text-sky-400 hover:underline" target="_blank" rel="noreferrer" href={`https://livenet.xrpl.org/transactions/${r.txHash}`}>{r.txHash.slice(0, 10)}…</a> : "—"}</td>
                <td className="py-2 capitalize">{r.status}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-sm opacity-60">No transactions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ----------------------------------------------------------- companies */

function CompaniesTab() {
  const { projects } = useApp();
  const [profiles, setProfiles] = useState<AuthorProfile[]>([]);
  const [tiers, setTiers] = useState<BadgeTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AuthorProfile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([fetchAllAuthorProfiles(), fetchBadgeTiers(true)]);
      setProfiles(p); setTiers(t);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const countFor = (p: AuthorProfile) => projects.filter((x) => x.submitterId === p.userId).length;
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.success(msg); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  if (loading) return <div className="text-sm opacity-70">Loading…</div>;

  return (
    <Panel title={`Companies & badges (${profiles.length})`}>
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="text-left text-xs opacity-70">
            <tr>
              <th className="pb-2">Company</th><th className="pb-2">Owner / email</th><th className="pb-2">Projects</th>
              <th className="pb-2">Verified</th><th className="pb-2">Visual badge</th><th className="pb-2">Landing page</th>
              <th className="pb-2">Joined</th><th></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t border-current/10">
                <td className="py-2 font-medium">{p.logo} {p.companyName}</td>
                <td className="py-2 text-xs opacity-70">{p.officialEmail ?? "—"}<br />{p.userId.slice(0, 8)}…</td>
                <td className="py-2">{countFor(p)}</td>
                <td className="py-2">
                  <button
                    onClick={() => act(() => setAuthorVerified(p.id, !p.verified), p.verified ? "Verification removed" : "Company verified")}
                    className={`rounded-full px-2 py-0.5 text-xs ${p.verified ? "bg-emerald-500/20 text-emerald-400" : "border border-current/25 opacity-70"}`}
                  >
                    {p.verified ? "Verified" : "Unverified"}
                  </button>
                </td>
                <td className="py-2">
                  <select
                    value={p.badgeTier ?? ""}
                    onChange={(e) => { const v = e.target.value || null; void act(() => setAuthorBadge(p.userId, v), v ? "Badge granted" : "Badge revoked"); }}
                    className={`${inp} w-40`}
                  >
                    <option value="">No badge</option>
                    {tiers.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                  </select>
                  {p.badgeSince && <div className="mt-1 text-[10px] opacity-60">since {new Date(p.badgeSince).toLocaleDateString()}</div>}
                </td>
                <td className="py-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={p.featured}
                      disabled={!p.verified}
                      onChange={(e) => void act(() => setCompanyFeatured(p.id, e.target.checked), e.target.checked ? "Shown in Verified Companies" : "Removed from Verified Companies")}
                    />
                    {p.verified ? "Featured" : "Needs badge"}
                  </label>
                </td>
                <td className="py-2 text-xs opacity-70">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="py-2 whitespace-nowrap text-right">
                  <button onClick={() => setView(p)} className="rounded border border-current/25 px-2 py-1 text-xs">Details</button>
                  <Link to="/company/$key" params={{ key: p.slug ?? p.id }} className="ml-1 rounded border border-current/25 px-2 py-1 text-xs">Public page</Link>
                </td>
              </tr>
            ))}
            {profiles.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-sm opacity-60">No company profiles yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {view && (
        <div className="mt-4 rounded-lg border border-current/15 p-4 text-sm">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{view.logo} {view.companyName}</div>
            <button onClick={() => setView(null)} className="text-xs opacity-70">✕ close</button>
          </div>
          <div className="mt-2 grid gap-1 text-xs opacity-80">
            <div><b>Owner id:</b> {view.userId}</div>
            <div><b>Email:</b> {view.officialEmail ?? "—"}</div>
            <div><b>Website:</b> {view.website ?? "—"}</div>
            <div><b>Badge:</b> {view.badgeTier ?? "none"}{view.badgeSince ? ` · since ${new Date(view.badgeSince).toLocaleDateString()}` : ""}</div>
            <div><b>Projects submitted:</b> {countFor(view)}</div>
          </div>
          {view.bio && <p className="mt-2 text-xs opacity-80">{view.bio}</p>}
          <div className="mt-3">
            <button
              onClick={() => { void act(() => setCompanyFeatured(view.id, !view.featured), "Landing page placement updated"); setView(null); }}
              className="rounded border border-current/25 px-2.5 py-1 text-xs"
            >{view.featured ? "Remove from landing page" : "Feature on landing page"}</button>
          </div>
        </div>
      )}
    </Panel>
  );
}
