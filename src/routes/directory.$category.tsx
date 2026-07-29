import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy path — categories now live at /category/$slug.
export const Route = createFileRoute("/directory/$category")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/category/$slug", params: { slug: params.category }, replace: true });
  },
});
