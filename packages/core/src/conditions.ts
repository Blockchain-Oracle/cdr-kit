import { encodeAbiParameters, type Hex } from "viem";
import { z } from "zod";

/// Zod-validated encoders for the D14 `config` bytes passed to a condition's setConfigFromFactory
/// (via CdrKitVault) and for the per-read `accessAuxData`. The exported schemas are reused by the
/// agent-kit tools so a tool's input validation and the on-chain encoding share one source of truth.

const hexSchema = z
  .custom<Hex>((v) => typeof v === "string" && /^0x[0-9a-fA-F]*$/.test(v), "expected 0x-hex string");
const addressSchema = z
  .custom<Hex>((v) => typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v), "expected a 0x address");

export const SubscriptionMode = { NativeIP: 0, WipRoyalty: 1 } as const;
export type SubscriptionModeValue = (typeof SubscriptionMode)[keyof typeof SubscriptionMode];

export const subscriptionConfigSchema = z.object({
  pricePerPeriod: z.bigint().nonnegative(),
  period: z.bigint().positive(),
  payee: addressSchema,
  mode: z.union([z.literal(0), z.literal(1)]),
  licensorIpId: addressSchema,
});
export type SubscriptionConfigInput = z.input<typeof subscriptionConfigSchema>;

export function encodeSubscriptionConfig(input: SubscriptionConfigInput): Hex {
  const p = subscriptionConfigSchema.parse(input);
  return encodeAbiParameters(
    [{ type: "uint256" }, { type: "uint256" }, { type: "address" }, { type: "uint8" }, { type: "address" }],
    [p.pricePerPeriod, p.period, p.payee, p.mode, p.licensorIpId],
  );
}

export const tierGateConfigSchema = z.object({
  ipId: addressSchema,
  allowedTermsIds: z.array(z.bigint().nonnegative()).min(1),
});
export type TierGateConfigInput = z.input<typeof tierGateConfigSchema>;

export function encodeTierGateConfig(input: TierGateConfigInput): Hex {
  const p = tierGateConfigSchema.parse(input);
  return encodeAbiParameters([{ type: "address" }, { type: "uint256[]" }], [p.ipId, p.allowedTermsIds]);
}

export const ComposeMode = { AND: 0, OR: 1 } as const;
export type ComposeModeValue = (typeof ComposeMode)[keyof typeof ComposeMode];

export const composableConfigSchema = z.object({
  mode: z.union([z.literal(0), z.literal(1)]),
  children: z.array(addressSchema).min(1).max(8),
});
export type ComposableConfigInput = z.input<typeof composableConfigSchema>;

export function encodeComposableConfig(input: ComposableConfigInput): Hex {
  const p = composableConfigSchema.parse(input);
  return encodeAbiParameters([{ type: "uint8" }, { type: "address[]" }], [p.mode, p.children]);
}

/** accessAuxData for TierGate: the license tokenId the caller holds. */
export function encodeTierGateAux(tokenId: bigint): Hex {
  return encodeAbiParameters([{ type: "uint256" }], [tokenId]);
}

/** accessAuxData for Composable: per-child aux, aligned to the configured children order. */
export function encodeComposableAux(perChild: Hex[]): Hex {
  return encodeAbiParameters([{ type: "bytes[]" }], [perChild.map((x) => hexSchema.parse(x))]);
}
