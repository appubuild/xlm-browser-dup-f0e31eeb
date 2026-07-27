import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { xamanPay, xamanStatus } from "@/lib/xaman.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  callXamanProxy, formatXamanConnectError, shouldUseXamanProxy,
  type XamanPaymentPayload, type XamanStatusPayload,
} from "@/lib/xaman-client";

/**
 * Reusable "pay with Xaman" modal. Creates a real XRPL payment payload,
 * shows the QR + deeplink and polls until it is signed, then hands the
 * on-ledger transaction hash back to the caller.
 */
export function XamanPayDialog({
  open, title, subtitle, amountXrp, memo, onClose, onPaid,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  amountXrp: number;
  memo: string;
  onClose: () => void;
  onPaid: (txHash: string, account: string | null) => Promise<void> | void;
}) {
  const pay = useServerFn(xamanPay);
  const status = useServerFn(xamanStatus);
  const [payload, setPayload] = useState<XamanPaymentPayload | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) { setPayload(null); setError(null); setDone(false); }
  }, [open, amountXrp, memo]);

  const start = async () => {
    setError(null);
    setCreating(true);
    try {
      const request = { amountXrp, memo };
      const res = await pay({ data: request });
      let next: XamanPaymentPayload | null = null;
      if (res.ok) next = res.data;
      else if (shouldUseXamanProxy(res.error)) {
        const fb = await callXamanProxy<XamanPaymentPayload>({ action: "pay", ...request });
        if (fb.ok) next = fb.data;
        else { setError(formatXamanConnectError(res.error, fb.error)); return; }
      } else { setError(res.error); return; }
      setPayload(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the payment request");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!payload || done) return;
    let stop = false;
    const t = setInterval(() => {
      void (async () => {
        try {
          const res = await status({ data: { uuid: payload.uuid } });
          let s: XamanStatusPayload | null = res.ok ? res.data : null;
          if (!s && !res.ok && shouldUseXamanProxy(res.error)) {
            const fb = await callXamanProxy<XamanStatusPayload>({ action: "status", uuid: payload.uuid });
            if (fb.ok) s = fb.data;
          }
          if (stop || !s) return;
          if (s.signed && s.txid) {
            clearInterval(t); setDone(true);
            await onPaid(s.txid, s.account);
            return;
          }
          if (s.cancelled || (s.resolved && !s.signed)) { clearInterval(t); setError("Payment was rejected in Xaman."); setPayload(null); }
          else if (s.expired) { clearInterval(t); setError("The payment request expired."); setPayload(null); }
        } catch { /* transient */ }
      })();
    }, 2500);
    return () => { stop = true; clearInterval(t); };
  }, [payload, status, onPaid, done]);

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          <div className="rounded border bg-muted/50 p-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><b>{amountXrp} XRP</b></div>
            {payload && (
              <div className="mt-1 flex justify-between gap-3">
                <span className="text-muted-foreground">To</span>
                <span className="break-all font-mono text-xs">{payload.destination}</span>
              </div>
            )}
          </div>
          {error && <div className="whitespace-pre-wrap rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          {payload ? (
            <div className="grid gap-3 sm:grid-cols-[200px_1fr] sm:items-center">
              <div className="mx-auto grid h-[212px] w-[212px] place-items-center rounded-lg border bg-white p-2">
                <img src={payload.qrPng} alt="Xaman payment QR" className="h-[196px] w-[196px]" />
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Scan with the Xaman app, or open it directly on this device.</div>
                <a href={payload.deeplink} target="_blank" rel="noreferrer" className="inline-block rounded bg-primary px-3 py-2 text-sm text-primary-foreground">Open in Xaman</a>
                <div className="text-xs text-muted-foreground">Waiting for signature…</div>
              </div>
            </div>
          ) : (
            <button onClick={start} disabled={creating || amountXrp <= 0}
              className="w-full rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
              {creating ? "Creating payment…" : `Pay ${amountXrp} XRP with Xaman`}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
