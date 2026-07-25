import { createFileRoute, useParams } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { BlogEditor } from "@/components/blog-editor";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/admin/blog/$id")({ component: EditBlogPost });

function EditBlogPost() {
  const { id } = useParams({ from: "/admin/blog/$id" });
  const { news } = useApp();
  const article = news.find((n) => n.id === id);
  return (
    <AdminShell>
      {article ? <BlogEditor id={id} initial={article} /> : <div className="p-10 text-center text-sm text-slate-400">Post not found.</div>}
    </AdminShell>
  );
}
