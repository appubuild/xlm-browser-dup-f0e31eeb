import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const xamanSignIn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ returnUrl: z.string().url().optional() }).parse(input ?? {}))
  .handler(async ({ data }) => {
    const { createSignInPayload } = await import("@/lib/xaman.server");
    return createSignInPayload(data.returnUrl);
  });

export const xamanPay = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      amountXrp: z.number().positive().max(100000),
      memo: z.string().max(240).optional(),
      returnUrl: z.string().url().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { createPaymentPayload } = await import("@/lib/xaman.server");
    return createPaymentPayload(data);
  });

export const xamanStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ uuid: z.string().min(10).max(64) }).parse(input))
  .handler(async ({ data }) => {
    const { getPayloadStatus } = await import("@/lib/xaman.server");
    return getPayloadStatus(data.uuid);
  });

export const xamanBalance = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ account: z.string().min(25).max(64), network: z.enum(["Mainnet", "Testnet"]).default("Mainnet") }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getXrpBalance } = await import("@/lib/xaman.server");
    return getXrpBalance(data.account, data.network);
  });
