import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { fetchCompanyByOwner, type AuthorProfile } from "@/lib/monetization";
import { BadgeCheck, Mail, Globe } from "lucide-react";

/** Sidebar card showing the company/author that submitted a project. */
export function ProjectCompanyCard({ ownerId }: { ownerId?: string | null }) {
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId) return;
    let stop = false;
    fetchCompanyByOwner(ownerId)
      .then((p) => { if (!stop) setProfile(p); })
      .catch((e) => { if (!stop) setErr(e instanceof Error ? e.message : "Could not load the company"); });
    return () => { stop = true; };
  }, [ownerId]);

  if (!ownerId) return null;
  if (err) return <div className="soft-card p-4 text-xs text-destructive">{err}</div>;
  if (!profile) return null;

  return (
    <div className="soft-card p-4 text-sm">
      <div className="mb-2 font-semibold">Submitted by</div>
      <Link to="/company/$key" params={{ key: profile.slug || profile.id }} className="flex items-center gap-3 rounded-md p-1 hover:bg-accent">
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-xl">
          {profile.logo?.startsWith("http")
            ? <img src={profile.logo} alt={`${profile.companyName} logo`} className="h-full w-full object-cover" loading="lazy" />
            : (profile.logo || "🏢")}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1 font-medium">
            <span className="truncate">{profile.companyName}</span>
            {profile.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
          </div>
          <div className="text-xs text-muted-foreground">View company profile →</div>
        </div>
      </Link>
      {profile.bio && <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{profile.bio}</p>}
      <div className="mt-2 space-y-1 text-xs">
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
            <Globe className="h-3.5 w-3.5" /> Website
          </a>
        )}
        {profile.officialEmail && (
          <a href={`mailto:${profile.officialEmail}`} className="flex items-center gap-1.5 text-primary hover:underline">
            <Mail className="h-3.5 w-3.5" /> {profile.officialEmail}
          </a>
        )}
      </div>
      {profile.socials.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {profile.socials.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer" className="rounded-full border px-2 py-0.5 text-xs hover:bg-accent">{s.platform}</a>
          ))}
        </div>
      )}
    </div>
  );
}
