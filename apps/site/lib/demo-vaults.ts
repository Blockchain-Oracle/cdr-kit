/**
 * Real CDR vaults on Aeneid testnet (factory 0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C).
 * Verified deployed via `cast call getVaultInfo(uint256)` over tokenIds 1..15.
 *
 * For the docs site, every Demo block connects to one of these UUIDs. When a
 * visitor connects their wallet, the SubscribeButton / VaultGate / Unlockable
 * runs the real on-chain flow against the named vault.
 */
export const DEMO_VAULTS = {
  /** Trading signal (JSON). Used by SubscribeButton, AccessStepper, etc. */
  tradingSignal: 4200,
  /** Secondary signal — used where the demo needs a second vault id. */
  secondarySignal: 4201,
  /** Image-bytes vault — proves the magic-byte image branch. */
  image: 4202,
  /** Prose-text vault — used by UnlockablePill and prose demos. */
  unlockProse: 4724,
  /** Multi-sig vault — used by MultiSigSigner / MultiSigApprovalTracker demos. */
  multiSig: 4874,
  /** Time-window vault — used by TimeWindowBadge demo. */
  timeWindow: 4875,
  /** Dead-man-switch vault — used by HeartbeatTimer demo. */
  deadMan: 4876,
  /** Escrow vault — used by EscrowDeliveryConfirm demo. */
  escrow: 4877,
} as const;

export type DemoVaultName = keyof typeof DEMO_VAULTS;
