import { createFileRoute } from "@tanstack/react-router";

/**
 * Read-only diagnostic: reports WHICH server secrets this deployment can see.
 * Never returns any secret value — only booleans.
 */
export const Route = createFileRoute("/api/public/xaman/diag")({
  server: {
    handlers: {
      GET: async () => {
        const present = (name: string) => Boolean(process.env?.[name]);
        return Response.json({
          runtime: typeof process !== "undefined" ? "process-env-available" : "no-process",
          secrets: {
            XAMAN_API_KEY: present("XAMAN_API_KEY"),
            XAMAN_API_SECRET: present("XAMAN_API_SECRET"),
            SB_SERVICE_ROLE_KEY: present("SB_SERVICE_ROLE_KEY"),
            SUPABASE_SERVICE_ROLE_KEY: present("SUPABASE_SERVICE_ROLE_KEY"),
            SUPABASE_URL: present("SUPABASE_URL"),
            SUPABASE_PUBLISHABLE_KEY: present("SUPABASE_PUBLISHABLE_KEY"),
          },
        });
      },
    },
  },
});
