import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";
import { fetchCompanyProfile, type AuthorProfile } from "@/lib/monetization";
import { Mail, Globe, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/company/$key")({
  component: CompanyPage,
  head: () => ({
    meta: [
      { title: "Company Profile — XRPBrowser" },
      { name: "description", content: "Company profile of an XRPL project author: verification badge, bio, social links and support contact." },
      { property: "og:title", content: "Company Profile — XRPBrowser" },
      { property: "og:description", content: "XRPL project author profile with verification badge and contact details." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function CompanyPage() {
  const { key } = Route.useParams();
  const { projects } = useApp();
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [err, setErr] = useState("");

  useEffect(() => {
    let stop = false;
    setState("loading");
    fetchCompanyProfile(key)
      .then((p) => { if (!stop) { setProfile(p); setState("ready"); } })
      .catch((e) => { if (!stop) { setErr(e instanceof Error ? e.message : "Could not load this company"); setState("error"); } });
    return () => { stop = true; };
  }, [key]);

  const owned = profile
    ? projects.filter((p) => p.submitterId === profile.userId && p.status === "approved" && p.isPublic)
    : [];

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        {state === "loading" && <div className="soft-card p-10 text-center text-muted-foreground">Loading company…</div>}
        {state === "error" && <div className="soft-card p-10 text-center text-destructive">{err}</div>}
        {state === "ready" && !profile && (
          <div className="soft-card p-10 text-center">
            <div className="text-lg font-semibold">Company not found</div>
            <p className="mt-1 text-sm text-muted-foreground">This company profile does not exist or was removed.</p>
            <Link to="/ecosystem" className="mt-4 inline-block text-primary hover:underline">Browse the ecosystem →</Link>
          </div>
        )}
        {profile && (
          <>
            <header className="soft-card flex flex-wrap items-start gap-4 p-6">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-3xl">
                {profile.logo?.startsWith("http")
                  ? <img src={profile.logo} alt={`${profile.companyName} logo`} className="h-full w-full object-cover" loading="lazy" />
                  : (profile.logo || "🏢")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">{profile.companyName}</h1>
                  {profile.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                </div>
                {profile.bio && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{profile.bio}</p>}
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                      <Globe className="h-4 w-4" /> Website
                    </a>
                  )}
                  {profile.officialEmail && (
                    <a href={`mailto:${profile.officialEmail}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                      <Mail className="h-4 w-4" /> {profile.officialEmail}
                    </a>
                  )}
                </div>
              </div>
            </header>

            {profile.socials.length > 0 && (
              <section className="mt-6">
                <h2 className="text-lg font-semibold">Social links</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.socials.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer" className="rounded-full border px-4 py-2 text-sm hover:bg-accent">
                      {s.platform} ↗
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-8">
              <h2 className="text-lg font-semibold">Projects by {profile.companyName}</h2>
              {owned.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No public projects yet.</p>
              ) : (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {owned.map((p) => (
                    <Link key={p.id} to="/project/$slug" params={{ slug: p.slug }} className="soft-card p-4">
                      <div className="text-2xl">{p.logo}</div>
                      <div className="mt-2 font-semibold">{p.name}</div>
                      <div className="text-xs uppercase text-muted-foreground">{p.category}</div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.tagline}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </PublicShell>
  );
}
