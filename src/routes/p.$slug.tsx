import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { getPage, type SitePage } from "@/lib/cms";

export const Route = createFileRoute("/p/$slug")({
  component: PublicPage,
  head: () => ({
    meta: [
      { title: "Page | XLM Browser" },
      { name: "description", content: "Read information pages from the XLM Browser Stellar discovery platform." },
      { property: "og:title", content: "Page | XLM Browser" },
      { property: "og:description", content: "Information pages from XLM Browser, the Stellar Network discovery portal." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function PublicPage() {
  const { slug } = Route.useParams();
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void (async () => {
      try { setPage(await getPage(slug)); } catch { setPage(null); }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (page?.title && typeof document !== "undefined") document.title = `${page.title} | XLM Browser`;
  }, [page?.title]);

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-10">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !page || !page.published ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold">Page not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">This page doesn’t exist or isn’t published.</p>
            <Link to="/" className="mt-4 inline-block text-sm text-primary underline">Back to home</Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold">{page.title}</h1>
            <article className="prose prose-sm mt-6 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: page.body }} />
          </>
        )}
      </div>
    </PublicShell>
  );
}
