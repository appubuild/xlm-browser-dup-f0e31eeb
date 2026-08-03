import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/about")({ component: About });

function About() {
  const { siteSettings } = useApp();
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">About XLM Browser</h1>
        <p className="mt-4 text-muted-foreground">XLM Browser is a search engine and discovery portal for the Stellar Network ecosystem. Our mission is to help users find, explore, and safely try Stellar projects without leaving one trusted surface.</p>
        <h2 className="mt-8 text-xl font-semibold">What we do</h2>
        <p className="mt-2 text-sm">We index and curate wallets, DeFi, gaming, infrastructure, NFT and tools built on the Stellar Network. Every listed project is reviewed before appearing publicly.</p>
        <div className="soft-card mt-8 p-4 text-sm">
          <div className="font-semibold">Contact</div>
          <div>{siteSettings.contactEmail}</div>
          <div>{siteSettings.contactCompany}</div>
          <div>{siteSettings.contactLocation}</div>
        </div>
      </div>
    </PublicShell>
  );
}
