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

export type PublicWalletConfig = { network: StellarNetwork; horizonUrl: string; treasuryAddress: string };

/** Non-secret wallet settings, readable by any visitor through a security-definer RPC. */
export async function loadPublicWalletConfig(): Promise<PublicWalletConfig> {
  const fallback: PublicWalletConfig = { network: "Mainnet", horizonUrl: HORIZON.Mainnet, treasuryAddress: "" };
  try {
    const { data } = await supabase.rpc("xaman_public_config" as never);
    const row = Array.isArray(data) ? (data[0] as Record<string, string> | undefined) : undefined;
    if (!row) return fallback;
    const network: StellarNetwork = row.network === "Testnet" ? "Testnet" : "Mainnet";
    return {
      network,
      horizonUrl: row.rpc_url?.startsWith("http") ? row.rpc_url : HORIZON[network],
      treasuryAddress: row.treasury_address ?? "",
    };
  } catch {
    return fallback;
  }
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

/** Ask Freighter for access and return the public key. Throws with a readable message. */
export async function connectFreighter(): Promise<string> {
  const api = await freighter();
  const installed = await api.isConnected();
  if (!installed.isConnected) {
    throw new Error(
      "Freighter wallet was not detected. Install the Freighter extension from https://freighter.app and reload this page.",
    );
  }
  const access = await api.requestAccess();
  if (access.error) throw new Error(String(access.error));
  if (!access.address) throw new Error("Freighter did not return an account. Unlock the wallet and try again.");
  return access.address;
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

/** Build, sign (Freighter) and submit an XLM payment. Returns the transaction hash. */
export async function payXlm(opts: {
  destination: string;
  amountXlm: number;
  memo?: string;
  network?: StellarNetwork;
  horizonUrl?: string;
}): Promise<{ hash: string; account: string }> {
  const network = opts.network ?? "Mainnet";
  const horizonUrl = opts.horizonUrl ?? HORIZON[network];
  if (!opts.destination) throw new Error("Treasury address is not configured yet.");

  const address = await connectFreighter();
  const [sdk, api] = await Promise.all([import("@stellar/stellar-sdk"), freighter()]);
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

  const signed = await api.signTransaction(tx.toXDR(), {
    networkPassphrase: PASSPHRASE[network],
    address,
  });
  if (signed.error) throw new Error(String(signed.error));

  const signedTx = sdk.TransactionBuilder.fromXDR(signed.signedTxXdr, PASSPHRASE[network]);
  const result = await server.submitTransaction(signedTx);
  return { hash: result.hash, account: address };
}
