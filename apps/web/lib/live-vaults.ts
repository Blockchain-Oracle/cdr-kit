import type { Hex } from "viem";
import type { SeedVault, ConditionKind } from "@/mock/seed";

/**
 * Metadata for the vaults seeded on-chain by `packages/core/scripts/seed-vaults.ts`. Title /
 * description / display price are NOT stored on-chain (only the encrypted payload + the condition
 * config are), so the dashboard carries them here, keyed by the on-chain uuid. Re-run the seed
 * script and paste its JSON output to refresh these.
 */
export interface LiveVaultMeta {
  uuid: number;
  condition: ConditionKind;
  priceWei: string;
  title: string;
  dataType: string;
  description: string;
  priceIp: number;
}

export const LIVE_VAULTS: LiveVaultMeta[] = [
  {
    uuid: 4200,
    condition: "subscription",
    priceWei: "2000000000000000",
    title: "ETH/USD oracle feed — 1s ticks",
    dataType: "Time series",
    description:
      "Sub-second ETH/USD marks aggregated across venues, signed and threshold-encrypted. Subscribers decrypt the latest window after an on-chain subscription.",
    priceIp: 0.002,
  },
  {
    uuid: 4201,
    condition: "subscription",
    priceWei: "3000000000000000",
    title: "DEX liquidation alpha stream",
    dataType: "Signals",
    description:
      "Forward-looking liquidation-pressure signals across major lending markets, refreshed each block and threshold-encrypted to subscribers.",
    priceIp: 0.003,
  },
  {
    uuid: 4202,
    condition: "subscription",
    priceWei: "5000000000000000",
    title: "On-chain credit-risk scores",
    dataType: "Model output",
    description:
      "Per-address default-probability scores from a model trained on 3y of liquidations. Royalties route to the model's IP asset on every subscription.",
    priceIp: 0.005,
  },
];

const ZERO = "0x0000000000000000000000000000000000000000" as Hex;
const truncate = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export const liveMetaByUuid = (uuid: number): LiveVaultMeta | undefined => LIVE_VAULTS.find((m) => m.uuid === uuid);
export const livePriceWei = (uuid: number): bigint => BigInt(liveMetaByUuid(uuid)?.priceWei ?? "0");

function metaToSeed(m: LiveVaultMeta, creator?: Hex): SeedVault {
  return {
    uuid: m.uuid,
    title: m.title,
    dataType: m.dataType,
    condition: m.condition,
    terms: `Subscribe ${m.priceIp} IP / 30 days`,
    priceIp: m.priceIp,
    subscribers: 0,
    creator: creator ?? ZERO,
    creatorName: creator ? truncate(creator) : "on-chain",
    description: m.description,
    sample: "", // live mode decrypts the real on-chain bytes; no canned sample
  };
}

/** Resolve a uuid to a card-ready vault: the seeded label map, else a generic on-chain placeholder. */
export function liveVaultToSeed(uuid: number, creator?: Hex): SeedVault {
  const m = liveMetaByUuid(uuid);
  if (m) return metaToSeed(m, creator);
  return {
    uuid,
    title: `Vault #${uuid}`,
    dataType: "On-chain",
    condition: "subscription",
    terms: "On-chain access condition",
    priceIp: null,
    subscribers: 0,
    creator: creator ?? ZERO,
    creatorName: creator ? truncate(creator) : "on-chain",
    description: "A Story CDR vault discovered on-chain. Connect a wallet to subscribe and decrypt it.",
    sample: "",
  };
}

/** Merge the known seeded vaults with any other on-chain vaults discovered via the factory events. */
export function mergeLiveVaults(discovered: { uuid: number; creator: Hex }[]): SeedVault[] {
  const creatorByUuid = new Map(discovered.map((d) => [d.uuid, d.creator]));
  const mapped = LIVE_VAULTS.map((m) => metaToSeed(m, creatorByUuid.get(m.uuid)));
  const known = new Set(LIVE_VAULTS.map((m) => m.uuid));
  const extra = discovered.filter((d) => !known.has(d.uuid)).map((d) => liveVaultToSeed(d.uuid, d.creator));
  return [...mapped, ...extra];
}
