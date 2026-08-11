import { supabase } from "@/integrations/supabase/client";

export type StellarNetwork = "Mainnet" | "Testnet";

export const HORIZON: Record<StellarNetwork, string> = {
  Mainnet: "https://horizon.stellar.org",
  Testnet: "https://horizon-testnet.stellar.org",
};

export const PASSPHRASE: Record<StellarNetwork, string> = {
  Mainnet: "Public Global Stellar Network ; September 2015",
  Testnet: "Test SDF Network ; September 2015",
};

export const EXPLORER: Record<StellarNetwork, string> = {
  Mainnet: "https://stellar.expert/explorer/public",
  Testnet: "https://stellar.expert/explorer/testnet",
};

/** Wallets the Stellar Wallets Kit modal can offer. */
export const WALLET_OPTIONS = [
  { id: "freighter", label: "Freighter" },
  { id: "xbull", label: "xBull" },
  { id: "albedo", label: "Albedo" },
  { id: "rabet", label: "Rabet" },
  { id: "lobstr", label: "Lobstr" },
  { id: "hana", label: "Hana" },
] as const;

export const DEFAULT_WALLETS = ["freighter", "xbull", "albedo", "rabet", "lobstr", "hana"];

export type PublicWalletConfig = {
  network: StellarNetwork;
  horizonUrl: string;
  treasuryAddress: string;
  enabledWallets: string[];
  walletConnectProjectId: string;
};

const FALLBACK_CONFIG: PublicWalletConfig = {
  network: "Mainnet",
  horizonUrl: HORIZON.Mainnet,
  treasuryAddress: "",
  enabledWallets: DEFAULT_WALLETS,
  walletConnectProjectId: "",
};

/** Non-secret wallet settings, readable by any visitor through a security-definer RPC. */
export async function loadPublicWalletConfig(): Promise<PublicWalletConfig> {
  try {
    const { data } = await supabase.rpc("stellar_public_config" as never);
    const row = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
    if (!row) return FALLBACK_CONFIG;
    const network: StellarNetwork = row.network === "Testnet" ? "Testnet" : "Mainnet";
    const rpcUrl = typeof row.rpc_url === "string" ? row.rpc_url : "";
    const wallets = Array.isArray(row.enabled_wallets) ? (row.enabled_wallets as string[]) : [];
    return {
      network,
      horizonUrl: rpcUrl.startsWith("http") ? rpcUrl : HORIZON[network],
      treasuryAddress: typeof row.treasury_address === "string" ? row.treasury_address : "",
      enabledWallets: wallets.length ? wallets : DEFAULT_WALLETS,
      walletConnectProjectId:
        typeof row.walletconnect_project_id === "string" ? row.walletconnect_project_id : "",
    };
  } catch {
    return FALLBACK_CONFIG;
  }
}

/* -------------------------------------------------------------------------- */
/* Stellar Wallets Kit (multi-wallet) with an automatic Freighter fallback     */
/* -------------------------------------------------------------------------- */

const SELECTED_KEY = "xlmb.wallet.id";

/* --- App-dialog coordination -------------------------------------------- */
/* While the wallet chooser (or a wallet app) is in front, our own modals must
   step aside — otherwise the Radix focus trap swallows clicks on the kit. */
type BusyListener = (busy: boolean) => void;
const busyListeners = new Set<BusyListener>();
let walletUiBusy = false;

export function isWalletUiBusy() { return walletUiBusy; }

export function onWalletUiBusy(listener: BusyListener): () => void {
  busyListeners.add(listener);
  return () => busyListeners.delete(listener);
}

function setWalletUiBusy(v: boolean) {
  walletUiBusy = v;
  busyListeners.forEach((l) => l(v));
}

/** Keep the kit's web-component modal above every app overlay. */
function ensureKitStyles() {
  if (typeof document === "undefined" || document.getElementById("swk-z")) return;
  const style = document.createElement("style");
  style.id = "swk-z";
  style.textContent =
    "stellar-wallets-modal,stellar-wallets-kit-modal,stellar-accounts-selector{position:relative;z-index:2147483000!important}";
  document.head.appendChild(style);
}

/** Touch devices open wallet apps (deep link / QR) instead of extensions. */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

/** Wallets that can actually complete a connect + sign on a phone. */
const MOBILE_WALLETS = ["lobstr", "xbull", "albedo", "hana"];

export function getSavedWalletId(): string | null {
  try { return window.localStorage.getItem(SELECTED_KEY); } catch { return null; }
}

type Kit = typeof import("@creit.tech/stellar-wallets-kit").StellarWalletsKit;

let kitPromise: Promise<Kit> | null = null;


/** Lazily build & init the kit in the browser. Throws when the kit cannot load. */
async function getKit(cfg: PublicWalletConfig): Promise<Kit> {
  if (typeof window === "undefined") throw new Error("Wallets are only available in the browser.");
  if (kitPromise) return kitPromise;

  kitPromise = (async () => {
    const [{ StellarWalletsKit }, { Networks }] = await Promise.all([
      import("@creit.tech/stellar-wallets-kit/sdk"),
      import("@creit.tech/stellar-wallets-kit/types"),
    ]);

    ensureKitStyles();
    const enabled = cfg.enabledWallets.length ? cfg.enabledWallets : DEFAULT_WALLETS;
    // On phones only show wallets that can open their app / scan a QR code.
    const usable = isMobileDevice() ? enabled.filter((w) => MOBILE_WALLETS.includes(w)) : enabled;
    const wanted = new Set(usable.length ? usable : enabled);
    const modules: unknown[] = [];


    if (wanted.has("freighter")) {
      const m = await import("@creit.tech/stellar-wallets-kit/modules/freighter");
      modules.push(new m.FreighterModule());
    }
    if (wanted.has("xbull")) {
      const m = await import("@creit.tech/stellar-wallets-kit/modules/xbull");
      modules.push(new m.xBullModule());
    }
    if (wanted.has("albedo")) {
      const m = await import("@creit.tech/stellar-wallets-kit/modules/albedo");
      modules.push(new m.AlbedoModule());
    }
    if (wanted.has("rabet")) {
      const m = await import("@creit.tech/stellar-wallets-kit/modules/rabet");
      modules.push(new m.RabetModule());
    }
    if (wanted.has("lobstr")) {
      const m = await import("@creit.tech/stellar-wallets-kit/modules/lobstr");
      modules.push(new m.LobstrModule());
    }
    if (wanted.has("hana")) {
      const m = await import("@creit.tech/stellar-wallets-kit/modules/hana");
      modules.push(new m.HanaModule());
    }
    if (!modules.length) throw new Error("No wallets are enabled.");

    StellarWalletsKit.init({
      modules: modules as never,
      network: cfg.network === "Testnet" ? Networks.TESTNET : Networks.PUBLIC,
      selectedWalletId: window.localStorage.getItem(SELECTED_KEY) ?? undefined,
    });
    return StellarWalletsKit;
  })().catch((e) => {
    kitPromise = null;
    throw e;
  });

  return kitPromise;
}

async function freighter() {
  return await import("@stellar/freighter-api");
}

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const api = await freighter();
    const res = await api.isConnected();
    return !!res.isConnected;
  } catch {
    return false;
  }
}

/** Direct Freighter connect — used as the automatic fallback when the kit fails. */
export async function connectFreighter(): Promise<string> {
  const api = await freighter();
  const installed = await api.isConnected();
  if (!installed.isConnected) {
    throw new Error(
      "No Stellar wallet was detected. Install Freighter from https://freighter.app (or use a supported mobile wallet) and reload this page.",
    );
  }
  const access = await api.requestAccess();
  if (access.error) throw new Error(String(access.error));
  if (!access.address) throw new Error("The wallet did not return an account. Unlock it and try again.");
  return access.address;
}

/**
 * Connect a Stellar account.
 * - Reuses the last picked wallet (one click, no chooser) when possible.
 * - Otherwise opens the Stellar Wallets Kit chooser; on phones it only lists
 *   wallets that can open their app or show a QR code.
 * - Falls back to a direct Freighter connection if the kit cannot run.
 */
export async function connectWallet(
  cfg?: PublicWalletConfig,
  opts?: { forceChooser?: boolean },
): Promise<{ address: string; via: "kit" | "freighter" }> {
  const config = cfg ?? (await loadPublicWalletConfig());
  setWalletUiBusy(true);
  try {
    const kit = await getKit(config);

    // 1) Silent reconnect with the previously selected wallet.
    const saved = getSavedWalletId();
    if (saved && !opts?.forceChooser) {
      try {
        await (kit as unknown as { setWallet: (id: string) => Promise<void> | void }).setWallet(saved);
        const { address } = await kit.getAddress();
        if (address) return { address, via: "kit" };
      } catch { /* fall through to the chooser */ }
    }

    // 2) Wallet chooser.
    const { address } = await kit.authModal();
    try {
      const id = (kit.selectedModule as { productId?: string } | undefined)?.productId;
      if (id) window.localStorage.setItem(SELECTED_KEY, id);
    } catch { /* storage may be unavailable */ }
    if (!address) throw new Error("No account returned");
    return { address, via: "kit" };
  } catch (e) {
    // User closed the modal on purpose — don't silently jump to Freighter.
    const msg = e instanceof Error ? e.message : String(e);
    if (/clos|cancel|reject|denied/i.test(msg)) throw new Error(msg);
    const address = await connectFreighter();
    return { address, via: "freighter" };
  } finally {
    setWalletUiBusy(false);
  }
}

export async function disconnectWallet(): Promise<void> {
  try {
    window.localStorage.removeItem(SELECTED_KEY);
    const mod = await import("@creit.tech/stellar-wallets-kit/sdk");
    await mod.StellarWalletsKit.disconnect();
  } catch { /* nothing connected */ }
}

/** Sign an XDR with the active kit wallet, falling back to Freighter. */
async function signXdr(xdr: string, networkPassphrase: string, address: string): Promise<string> {
  setWalletUiBusy(true);
  try {
    const mod = await import("@creit.tech/stellar-wallets-kit/sdk");
    const res = await mod.StellarWalletsKit.signTransaction(xdr, { networkPassphrase, address });
    if (res?.signedTxXdr) return res.signedTxXdr;
    throw new Error("The wallet did not return a signed transaction.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/reject|denied|declin|cancel/i.test(msg)) throw new Error(msg);
    const api = await freighter();
    const signed = await api.signTransaction(xdr, { networkPassphrase, address });
    if (signed.error) throw new Error(String(signed.error));
    return signed.signedTxXdr;
  } finally {
    setWalletUiBusy(false);
  }
}


export async function getStellarBalance(
  account: string,
  network: StellarNetwork = "Mainnet",
): Promise<{ balance: number; funded: boolean }> {
  const res = await fetch(`${HORIZON[network]}/accounts/${encodeURIComponent(account)}`);
  if (res.status === 404) return { balance: 0, funded: false };
  if (!res.ok) throw new Error(`Horizon ${res.status}`);
  const json = (await res.json()) as { balances?: { asset_type: string; balance: string }[] };
  const native = json.balances?.find((b) => b.asset_type === "native");
  return { balance: Number(native?.balance ?? 0), funded: true };
}

/** Build, sign (any supported wallet) and submit an XLM payment. Returns the transaction hash. */
export async function payXlm(opts: {
  destination: string;
  amountXlm: number;
  memo?: string;
  network?: StellarNetwork;
  horizonUrl?: string;
  address?: string;
  config?: PublicWalletConfig;
}): Promise<{ hash: string; account: string }> {
  const network = opts.network ?? "Mainnet";
  const horizonUrl = opts.horizonUrl ?? HORIZON[network];
  if (!opts.destination) throw new Error("Treasury address is not configured yet.");

  const address = opts.address ?? (await connectWallet(opts.config)).address;
  const sdk = await import("@stellar/stellar-sdk");
  const server = new sdk.Horizon.Server(horizonUrl);
  const source = await server.loadAccount(address);

  const builder = new sdk.TransactionBuilder(source, {
    fee: String(await server.fetchBaseFee()),
    networkPassphrase: PASSPHRASE[network],
  }).addOperation(
    sdk.Operation.payment({
      destination: opts.destination,
      asset: sdk.Asset.native(),
      amount: opts.amountXlm.toFixed(7),
    }),
  );
  if (opts.memo) builder.addMemo(sdk.Memo.text(opts.memo.slice(0, 28)));
  const tx = builder.setTimeout(180).build();

  const signedXdr = await signXdr(tx.toXDR(), PASSPHRASE[network], address);
  const signedTx = sdk.TransactionBuilder.fromXDR(signedXdr, PASSPHRASE[network]);
  const result = await server.submitTransaction(signedTx);
  return { hash: result.hash, account: address };
}
