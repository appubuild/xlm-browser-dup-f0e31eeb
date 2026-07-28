import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";
import { useViewport } from "@/components/browser-viewport";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ProjectAiChat, ProjectFaq } from "@/components/project-ai";
import { ProjectCompanyCard } from "@/components/project-company-card";
import { toast } from "sonner";
import { trackProjectEvent } from "@/lib/analytics";

export const Route = createFileRoute("/project/$slug")({ component: ProjectPage });

function ProjectPage() {
  const { slug } = Route.useParams();
  const { projects, bookmarks, toggleBookmark, user } = useApp();
  const viewport = useViewport();
  const [tab, setTab] = useState<"overview" | "ai" | "faq" | "details" | "links">("overview");
  const [reportOpen, setReportOpen] = useState(false);
  useEffect(() => { void trackProjectEvent(slug, "view", user?.id ?? null); }, [slug, user?.id]);
  const project = projects.find((p) => p.slug === slug);
  if (!project) return <PublicShell><div className="p-10 text-center">Project not found. <Link to="/ecosystem" className="text-primary underline">Browse ecosystem</Link></div></PublicShell>;
  const related = projects.filter((p) => p.category === project.category && p.slug !== slug && p.status === "approved" && p.isPublic).slice(0, 4);
  const bookmarked = bookmarks.includes(slug);
  const descHtml = project.description || "";
  const looksLikeHtml = /<\w+[\s>]/.test(descHtml);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <nav className="text-xs text-muted-foreground">
          <Link to="/ecosystem">Ecosystem</Link> / <Link to="/directory/$category" params={{ category: project.category }} className="capitalize hover:underline">{project.category}</Link> / <span>{project.name}</span>
        </nav>

        <header className="mt-4 flex flex-wrap items-start gap-4">
          <div className="text-6xl">{project.logo}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              {project.verified && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">✓ Verified</span>}
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{project.category}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${project.liveStatus === "Live" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> {project.liveStatus}
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">{project.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => viewport.open(project)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Open in Browser</button>
              <a href={project.url} target="_blank" rel="noreferrer" className="rounded-md border px-4 py-2 text-sm hover:bg-accent">Visit Official Site ↗</a>
              <button onClick={() => { toggleBookmark(slug); toast(bookmarked ? "Bookmark removed" : "Bookmark added"); }} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">{bookmarked ? "★ Bookmarked" : "☆ Bookmark"}</button>
              <button onClick={() => setReportOpen(true)} className="ml-auto rounded-md border px-3 py-2 text-xs text-muted-foreground hover:bg-accent">🚩 Report</button>
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
          <div>
            <div className="flex flex-wrap gap-1 border-b">
              {(["overview", "ai", "faq", "details", "links"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm capitalize ${tab === t ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}>
                  {t === "ai" ? "Ask AI" : t}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-4">
              {tab === "overview" && (
                <>
                  {looksLikeHtml
                    ? <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: descHtml }} />
                    : <p>{descHtml}</p>
                  }
                  <div className="soft-card grid h-56 place-items-center text-6xl">{project.logo}</div>
                  <div className="text-sm text-muted-foreground">Launch date: {project.dateAdded} · Website: <a href={project.url} className="text-primary hover:underline">{project.url}</a></div>
                </>
              )}
              {tab === "ai" && <ProjectAiChat project={project} />}
              {tab === "faq" && <ProjectFaq project={project} />}
              {tab === "details" && (
                <div className="soft-card p-4 text-sm">
                  <div><b>Category:</b> {project.category}</div>
                  <div><b>Live status:</b> {project.liveStatus}</div>
                  <div><b>Verified:</b> {project.verified ? "Yes" : "No"}</div>
                  <div><b>Featured:</b> {project.featured ? "Yes" : "No"}</div>
                  {project.supportEmail && <div><b>Support:</b> <a className="text-primary hover:underline" href={`mailto:${project.supportEmail}`}>{project.supportEmail}</a></div>}
                </div>
              )}
              {tab === "links" && (
                <ul className="space-y-2 text-sm">
                  <li>Website: <a href={project.url} className="text-primary hover:underline">{project.url}</a></li>
                  {project.socials.twitter && <li>Twitter: <a href={project.socials.twitter} className="text-primary hover:underline">{project.socials.twitter}</a></li>}
                  {project.socials.discord && <li>Discord: <a href={project.socials.discord} className="text-primary hover:underline">{project.socials.discord}</a></li>}
                  {project.socials.telegram && <li>Telegram: <a href={project.socials.telegram} className="text-primary hover:underline">{project.socials.telegram}</a></li>}
                  {project.socials.github && <li>GitHub: <a href={project.socials.github} className="text-primary hover:underline">{project.socials.github}</a></li>}
                  {project.supportEmail && <li>Support email: <a className="text-primary hover:underline" href={`mailto:${project.supportEmail}`}>{project.supportEmail}</a></li>}
                </ul>
              )}
            </div>

            {related.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-3 text-lg font-semibold">Related projects</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {related.map((r) => (
                    <Link key={r.id} to="/project/$slug" params={{ slug: r.slug }} className="soft-card flex items-center gap-3 p-3">
                      <div className="text-2xl">{r.logo}</div>
                      <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.tagline}</div></div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <aside className="space-y-4">
            <ProjectCompanyCard ownerId={project.submitterId} />
            <div className="soft-card p-4 text-sm">
              <div className="mb-2 font-semibold">Stats</div>
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Total visits</span><b>{project.visits.toLocaleString()}</b></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="capitalize">{project.category}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date added</span><span>{project.dateAdded}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{project.liveStatus}</span></div>
              </div>
            </div>
            {tab !== "ai" && <ProjectAiChat project={project} />}
          </aside>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report project</DialogTitle></DialogHeader>
          <textarea placeholder="Why are you reporting this project?" className="min-h-24 w-full rounded-md border bg-background p-2 text-sm" />
          <DialogFooter>
            <button onClick={() => { setReportOpen(false); toast.success("Thank you, our team will review this."); }} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Submit report</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicShell>
  );
}
