import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { BlogEditor } from "@/components/blog-editor";

export const Route = createFileRoute("/admin/blog/new")({ component: () => <AdminShell><BlogEditor /></AdminShell> });
