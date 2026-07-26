import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { PageEditor } from "@/components/page-editor";
import { listPages, type SitePage } from "@/lib/cms";

export const Route = createFileRoute("/admin/pages/$id")({ component: EditPage });

function EditPage() {
  const { id } = useParams({ from: "/admin/pages/$id" });
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const all = await listPages(true);
      setPage(all.find((p) => p.id === id) ?? null);
      setLoading(false);
    })();
  }, [id]);

  return (
    <AdminShell>
      {loading ? (
        <div className="p-10 text-center text-sm opacity-60">Loading…</div>
      ) : page ? (
        <PageEditor initial={page} />
      ) : (
        <div className="p-10 text-center text-sm opacity-60">Page not found.</div>
      )}
    </AdminShell>
  );
}
