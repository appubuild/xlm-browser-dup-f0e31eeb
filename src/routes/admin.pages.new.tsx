import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { PageEditor } from "@/components/page-editor";

export const Route = createFileRoute("/admin/pages/new")({
  component: () => (
    <AdminShell>
      <PageEditor />
    </AdminShell>
  ),
});
