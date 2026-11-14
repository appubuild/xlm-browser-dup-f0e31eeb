// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    plugins: [{
      name: "stellar-toml-public-response",
      enforce: "pre",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (new URL(req.url ?? "/", "http://localhost:8080").pathname !== "/.well-known/stellar.toml") return next();
          const { stellarTomlResponse } = await server.ssrLoadModule("/src/lib/stellar-toml-response.ts");
          const response: Response | undefined = stellarTomlResponse(new Request(
            new URL(req.url ?? "/", "http://localhost:8080"),
            { method: req.method ?? "GET" },
          ));
          if (!response) return next();
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        });
        // Vite installs its generic preflight handler before plugin hooks.
        // Put this exact-path handler first without changing CORS for other URLs.
        const resourceMiddleware = server.middlewares.stack.pop();
        if (resourceMiddleware) server.middlewares.stack.unshift(resourceMiddleware);
      },
    }],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
