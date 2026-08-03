import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <div className="prose mt-6 space-y-4 text-sm">
          <section><h2 className="font-semibold">Data Collection</h2><p>We collect minimal information required to operate XLM Browser. We do not sell personal data.</p></section>
          <section><h2 className="font-semibold">Cookies</h2><p>We use essential cookies for authentication and preferences (like your theme).</p></section>
          <section><h2 className="font-semibold">Third Parties</h2><p>We do not share personal data with third parties except as required by law.</p></section>
          <section><h2 className="font-semibold">Contact</h2><p>partner@skipads.ai · SkipAds AI LLC · Detroit, MI · USA</p></section>
        </div>
      </div>
    </PublicShell>
  );
}
