import { createFileRoute } from "@tanstack/react-router";
import xlmBrowserLogo from "@/assets/xlm-browser-logo.png.asset.json";

export const Route = createFileRoute("/imades")({
  head: () => ({
    meta: [
      { title: "XLM Browser Logo" },
      { name: "description", content: "Official XLM Browser logo." },
      { property: "og:title", content: "XLM Browser Logo" },
      { property: "og:description", content: "Official XLM Browser logo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LogoPage,
});

function LogoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <img
        src={xlmBrowserLogo.url}
        alt="XLM Browser logo"
        className="h-auto max-h-[calc(100vh-2rem)] w-full max-w-3xl object-contain"
      />
    </main>
  );
}