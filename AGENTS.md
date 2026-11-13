<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Brand image route
- Keep `/imades` as a dedicated page rendering the supplied brand image so the requested no-extension URL displays the logo directly.
- Brand logos live as real files in `public/images/` (not CDN pointers) so `/images/logo-*.png` URLs serve PNGs directly on any domain.
- Admin-uploaded gallery images are stored in the private `gallery` bucket (public buckets are blocked) and served through the `/media/*` server route.
