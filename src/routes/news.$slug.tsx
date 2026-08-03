import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/news/$slug")({
  component: NewsArticle,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — XLM Browser News` },
      { property: "og:title", content: `${params.slug} — XLM Browser News` },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/news/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/news/${params.slug}` }],
  }),
});

function NewsArticle() {
  const { slug } = Route.useParams();
  const { news } = useApp();
  const article = news.find((n) => n.slug === slug);
  if (!article) return <PublicShell><div className="p-10 text-center">Article not found. <Link to="/news" className="text-primary underline">Back to news</Link></div></PublicShell>;
  const related = news.filter((n) => n.slug !== slug && n.status === "published").slice(0, 3);
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/news" className="text-sm text-muted-foreground hover:underline">← News</Link>
        <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{article.category} · {article.publishDate}</div>
        <h1 className="mt-1 text-3xl font-bold md:text-4xl">{article.title}</h1>
        <div className="mt-2 text-sm text-muted-foreground">By {article.author}</div>
        <div className="soft-card mt-6 overflow-hidden">
          {article.coverImageUrl
            ? <img src={article.coverImageUrl} alt={article.title} className="h-64 w-full object-cover md:h-80" />
            : <div className="grid h-64 place-items-center text-7xl">{article.coverImage}</div>}
        </div>
        {article.excerpt && <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>}
        <div className="prose prose-slate mt-6 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: article.body || "" }} />
        {article.tags && article.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {article.tags.map((t) => <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">#{t}</span>)}
          </div>
        )}
        <h3 className="mt-10 text-lg font-semibold">Related</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {related.map((r) => (
            <Link key={r.id} to="/news/$slug" params={{ slug: r.slug }} className="soft-card overflow-hidden">
              <div className="h-24 w-full overflow-hidden bg-muted">
                {r.coverImageUrl ? <img src={r.coverImageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-2xl">{r.coverImage}</div>}
              </div>
              <div className="p-2 text-sm font-medium">{r.title}</div>
            </Link>
          ))}
        </div>
      </article>
    </PublicShell>
  );
}
