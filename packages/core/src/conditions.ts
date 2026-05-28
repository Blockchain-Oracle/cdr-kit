import { encodeAbiParameters, type Hex } from "viem";

/// Encoders for the D14 `config` bytes passed to a condition's setConfigFromFactory (via CdrKitVault),
/// and for the per-read `accessAuxData`. Layouts mirror the Solidity exactly.

export const SubscriptionMode = { NativeIP: 0, WipRoyalty: 1 } as const;
export type SubscriptionModeValue = (typeof SubscriptionMode)[keyof typeof SubscriptionMode];

export function encodeSubscriptionConfig(p: {
  pricePerPeriod: bigint;
  period: bigint;
  payee: Hex;
  mode: SubscriptionModeValue;
  licensorIpId: Hex;
}): Hex {
  return encodeAbiParameters(
    [{ type: "uint256" }, { type: "uint256" }, { type: "address" }, { type: "uint8" }, { type: "address" }],
    [p.pricePerPeriod, p.period, p.payee, p.mode, p.licensorIpId],
  );
}

export function encodeTierGateConfig(p: { ipId: Hex; allowedTermsIds: bigint[] }): Hex {
  return encodeAbiParameters([{ type: "address" }, { type: "uint256[]" }], [p.ipId, p.allowedTermsIds]);
}

export const ComposeMode = { AND: 0, OR: 1 } as const;
export type ComposeModeValue = (typeof ComposeMode)[keyof typeof ComposeMode];

export function encodeComposableConfig(p: { mode: ComposeModeValue; children: Hex[] }): Hex {
  return encodeAbiParameters([{ type: "uint8" }, { type: "address[]" }], [p.mode, p.children]);
}

/** accessAuxData for TierGate: the license tokenId the caller holds. */
export function encodeTierGateAux(tokenId: bigint): Hex {
  return encodeAbiParameters([{ type: "uint256" }], [tokenId]);
}

/** accessAuxData for Composable: per-child aux, aligned to the configured children order. */
export function encodeComposableAux(perChild: Hex[]): Hex {
  return encodeAbiParameters([{ type: "bytes[]" }], [perChild]);
}
