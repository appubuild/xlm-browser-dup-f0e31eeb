import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { XlmAmount } from "@/components/xlm-amount";
import { useWalletUiBusy } from "@/hooks/use-wallet-ui-busy";
import {
  connectWallet, loadPublicWalletConfig, payXlm, type PublicWalletConfig,
} from "@/lib/stellar-wallet";


/**
 * Reusable "pay with a Stellar wallet" modal. Opens the Stellar Wallets Kit
 * chooser (Freighter, xBull, Albedo, Rabet, Lobstr, Hana — with an automatic
 * Freighter fallback), builds a real payment, has the user sign it, submits it
 * to Horizon and hands the on-ledger transaction hash back to the caller.
 */
export function StellarPayDialog({
  open, title, subtitle, amountXlm, memo, onClose, onPaid,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  amountXlm: number;
  memo: string;
  onClose: () => void;
  onPaid: (txHash: string, account: string | null) => Promise<void> | void;
}) {
  const [config, setConfig] = useState<PublicWalletConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDone(false);
    setStep(null);
    void loadPublicWalletConfig().then(setConfig);
  }, [open, amountXlm, memo]);

  const start = async () => {
    setError(null);
    setBusy(true);
    try {
      const cfg = config ?? (await loadPublicWalletConfig());
      setStep("Choose your wallet…");
      const { address, via } = await connectWallet(cfg);
      setStep(via === "kit" ? "Approve the payment in your wallet…" : "Approve the payment in Freighter…");
      const { hash, account } = await payXlm({
        destination: cfg.treasuryAddress,
        amountXlm,
        memo,
        network: cfg.network,
        horizonUrl: cfg.horizonUrl,
        address,
        config: cfg,
      });
      setStep(null);
      setDone(true);
      await onPaid(hash, account);
    } catch (e) {
      setStep(null);
      setError(e instanceof Error ? e.message : "The payment could not be completed");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          <div className="rounded border bg-muted/50 p-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><b><XlmAmount xlm={amountXlm} inline /></b></div>
            {config?.treasuryAddress && (
              <div className="mt-1 flex justify-between gap-3">
                <span className="text-muted-foreground">To</span>
                <span className="break-all font-mono text-xs">{config.treasuryAddress}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Network</span><span>{config?.network ?? "Mainnet"}</span></div>
          </div>
          {error && <div className="whitespace-pre-wrap rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          {done ? (
            <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs">Payment confirmed on the Stellar network ✅</div>
          ) : (
            <>
              <button onClick={() => void start()} disabled={busy || amountXlm <= 0}
                className="w-full rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
                {busy ? (step ?? "Working…") : `Pay ${amountXlm} XLM with your wallet`}
              </button>
              <p className="text-xs text-muted-foreground">
                Works with Freighter, xBull, Albedo, Rabet, Lobstr and Hana. No wallet yet? Get{" "}
                <a href="https://freighter.app" target="_blank" rel="noreferrer" className="underline">Freighter</a>.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
