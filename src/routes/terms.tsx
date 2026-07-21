import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";

export const Route = createFileRoute("/terms")({ component: Terms });

function Terms() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <div className="mt-6 space-y-4 text-sm">
          <section><h2 className="font-semibold">Acceptable Use</h2><p>Use XRPBrowser lawfully and respect other users and listed projects.</p></section>
          <section><h2 className="font-semibold">Disclaimers</h2><p>XRPBrowser provides listings for informational purposes. We are not responsible for third-party project behavior.</p></section>
          <section><h2 className="font-semibold">Liability</h2><p>To the maximum extent permitted by law, XRPBrowser is provided "as is" without warranties.</p></section>
          <section><h2 className="font-semibold">Governing Law</h2><p>These terms are governed by the laws of the State of Michigan, USA.</p></section>
          <section><h2 className="font-semibold">Contact</h2><p>partner@skipads.ai · SkipAds AI LLC · Detroit, MI · USA</p></section>
        </div>
      </div>
    </PublicShell>
  );
}
