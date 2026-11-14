# Stellar TOML hosting

## Source and endpoint

- Source: `public/.well-known/stellar.toml` (existing supplied metadata preserved).
- Public endpoint: `https://xlmbrowser.com/.well-known/stellar.toml`.
- `src/lib/stellar-toml-response.ts` imports the file as build-time raw text, with no runtime filesystem, database, credentials or session requirements.
- `src/server.ts` handles only this exact path before SSR. Development middleware in `vite.config.ts` uses the same handler.
- Root `wrangler.json` sets this path Worker-first. Nitro merges this into its generated deployment configuration while retaining the existing entry and asset binding. Deploy the generated configuration, not the root fragment alone.
- `public/_headers` supplies equivalent resource-only headers when static assets are served directly. It is not a replacement for the Worker OPTIONS handler.

## Responses

GET and HEAD return 200; OPTIONS returns 204; unsupported methods return 405 with Allow. Every response has wildcard origin CORS, GET/HEAD/OPTIONS allowed methods, `text/plain; charset=utf-8`, and `nosniff`. Browser caches must revalidate; Cloudflare CDN caching is disabled for this resource. No wildcard CORS is added to unrelated routes.

## Updates and deployment

Edit the source file, run the verification script, commit and deploy through the existing Cloudflare/Lovable flow. This static approach requires redeployment; it adds no Supabase tables, policies, settings, dependencies or secrets. Do not add an admin editor or a second configuration source without an explicit need.

If an external Cloudflare workflow ignores Nitro's generated config, merge `assets.run_worker_first = ["/.well-known/stellar.toml"]` into the actual deployment configuration, preserving existing Worker-first paths. Keep the existing Worker name, bindings and secrets. Ensure no Cloudflare Access rule protects this discovery URL. Purge any pre-existing cache entry for the URL once after deployment and remove any overriding cache-everything rule for this path.

## Validation

```sh
python3 scripts/verify-stellar-toml.py
python3 scripts/verify-stellar-toml.py https://xlmbrowser.com
curl -i https://xlmbrowser.com/.well-known/stellar.toml
curl -I https://xlmbrowser.com/.well-known/stellar.toml
curl -i -X OPTIONS -H 'Origin: https://example.org' -H 'Access-Control-Request-Method: GET' https://xlmbrowser.com/.well-known/stellar.toml
```

The script checks syntax, exact supplied content, asset rules and response headers/statuses without authentication. Run a browser fetch from a separate origin as well; passing local checks does not prove deployed behavior.

## Metadata verification and limitations

Both supplied public keys pass Stellar SDK checksum validation and return HTTP 200 from Stellar mainnet Horizon. The issuer has `home_domain = xlmbrowser.com`. The second listed account has no home_domain; do not claim domain association for that account. Supply/set that association from the owning wallet if it is required by the intended integration.

The supplied ORG_URL uses `www.xlmbrowser.com`; its emails, asset name spelling and external toofundex.io image URLs remain unchanged. No organization identity or token supply audit is implied by syntactic validation. Switching to the site's own 512px logo requires confirmation rather than silently changing supplied metadata.

At the initial live check on 2026-11-14, TOML returned 200 with `application/toml` but no required CORS header. Both `/images/logo-512.png` and `/images` returned 200. Updated live CORS must be verified after deployment; no dashboard changes or production deployment are performed by this implementation.

Local verification passed GET 200, HEAD 200, OPTIONS 204 and POST 405, exact file content, TOML parsing and all required headers. A separate-origin browser fetch also passed, with Chromium's local-network permission check disabled only for this localhost test (CORS remained enabled). The browser displayed the raw TOML; the gallery remained accessible; a nonexistent media request remained 404 without wildcard CORS. No new Supabase access rules were introduced; existing authenticated storage access was not exhaustively retested. The automatic build reported OK after the changes.