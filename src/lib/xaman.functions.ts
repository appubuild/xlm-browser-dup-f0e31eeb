import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Never throw out of these: a thrown server-fn error blanks the app with the error overlay.
 *  Return { ok:false, error } and let the UI show it inline. */
async function safe<T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Xaman request failed" };
  }
}

export const xamanSignIn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ returnUrl: z.string().url().optional() }).parse(input ?? {}))
  .handler(async ({ data }) =>
    safe(async () => {
      const { createSignInPayload } = await import("@/lib/xaman.server");
      return createSignInPayload(data.returnUrl);
    }),
  );

export const xamanPay = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      amountXlm: z.number().positive().max(100000),
      memo: z.string().max(240).optional(),
      returnUrl: z.string().url().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) =>
    safe(async () => {
      const { createPaymentPayload } = await import("@/lib/xaman.server");
      return createPaymentPayload(data);
    }),
  );

export const xamanStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ uuid: z.string().min(10).max(64) }).parse(input))
  .handler(async ({ data }) =>
    safe(async () => {
      const { getPayloadStatus } = await import("@/lib/xaman.server");
      return getPayloadStatus(data.uuid);
    }),
  );

export const xamanBalance = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ account: z.string().min(25).max(64), network: z.enum(["Mainnet", "Testnet"]).default("Mainnet") }).parse(input),
  )
  .handler(async ({ data }) =>
    safe(async () => {
      const { getXlmBalance } = await import("@/lib/xaman.server");
      return getXlmBalance(data.account, data.network);
    }),
  );
