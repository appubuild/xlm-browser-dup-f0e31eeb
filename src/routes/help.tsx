import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/help")({ component: Help });

const faqs = [
  { q: "What is XRPBrowser?", a: "A search engine and discovery portal for the XRP Ledger ecosystem." },
  { q: "How do I submit a project?", a: "Go to /submit and complete the 3-step form. Our team reviews new submissions." },
  { q: "Is XRPBrowser affiliated with Ripple?", a: "No. XRPBrowser is an independent directory operated by SkipAds AI LLC." },
  { q: "How do I connect a wallet?", a: "Click 'Connect Wallet' in the top nav and choose your preferred XRPL wallet." },
  { q: "Do you store my keys?", a: "No. XRPBrowser never has access to private keys." },
];

function Help() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Help &amp; Support</h1>
        <Accordion type="single" collapsible className="mt-6">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="soft-card mt-8 p-6">
          <div className="font-semibold">Need more help?</div>
          <p className="mt-1 text-sm text-muted-foreground">Reach us at <a className="text-primary hover:underline" href="mailto:partner@skipads.ai">partner@skipads.ai</a></p>
        </div>
      </div>
    </PublicShell>
  );
}
