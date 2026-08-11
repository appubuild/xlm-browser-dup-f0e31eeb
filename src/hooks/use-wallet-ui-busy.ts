import { useEffect, useState } from "react";
import { isWalletUiBusy, onWalletUiBusy } from "@/lib/stellar-wallet";

/**
 * True while the wallet chooser (or a wallet app) is in front of the page.
 * App dialogs hide themselves during that time so their focus trap does not
 * block clicks on the Stellar Wallets Kit modal.
 */
export function useWalletUiBusy(): boolean {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setBusy(isWalletUiBusy());
    return onWalletUiBusy(setBusy);
  }, []);
  return busy;
}
