import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/news/$slug")({ component: NewsArticle });

function NewsArticle() {
  const { slug } = Route.useParams();
  const { news } = useApp();
  const article = news.find((n) => n.slug === slug);
  if (!article) return <PublicShell><div className="p-10 text-center">Article not found. <Link to="/news" className="text-primary underline">Back to news</Link></div></PublicShell>;
  const related = news.filter((n) => n.slug !== slug).slice(0, 3);
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/news" className="text-sm text-muted-foreground hover:underline">← News</Link>
        <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{article.category} · {article.publishDate}</div>
        <h1 className="mt-1 text-3xl font-bold md:text-4xl">{article.title}</h1>
        <div className="mt-2 text-sm text-muted-foreground">By {article.author}</div>
        <div className="soft-card mt-6 grid h-64 place-items-center text-7xl">{article.coverImage}</div>
        <p className="mt-6 text-base leading-relaxed">{article.body}</p>
        <div className="mt-6 flex gap-2 text-sm">
          <button className="rounded border px-3 py-1.5">Share</button>
          <button className="rounded border px-3 py-1.5">Copy link</button>
        </div>
        <h3 className="mt-10 text-lg font-semibold">Related</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {related.map((r) => (
            <Link key={r.id} to="/news/$slug" params={{ slug: r.slug }} className="soft-card p-3">
              <div className="text-2xl">{r.coverImage}</div>
              <div className="mt-1 text-sm font-medium">{r.title}</div>
            </Link>
          ))}
        </div>
      </article>
    </PublicShell>
  );
}
