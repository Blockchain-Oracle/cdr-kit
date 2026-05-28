import { createMockCdrKit } from "@cdr-kit/core";

export type ConditionKind = "subscription" | "tiergate" | "composable";

export interface SeedVault {
  uuid: number;
  title: string;
  dataType: string;
  condition: ConditionKind;
  /** Plain-language condition terms shown on the card + detail. */
  terms: string;
  priceIp: number | null;
  subscribers: number;
  creator: `0x${string}`;
  creatorName: string;
  description: string;
  /** Bytes returned by the mock access flow (what "decrypts"). */
  sample: string;
}

export const seedVaults: SeedVault[] = [
  {
    uuid: 9001,
    title: "ETH/USD oracle feed — 1s ticks",
    dataType: "Time series",
    condition: "subscription",
    terms: "Subscribe 8 IP / 30 days",
    priceIp: 8,
    subscribers: 214,
    creator: "0x7c6b2f9A4d1E3b8C0a5F6e7D8c9B0a1E2f3C4d5E",
    creatorName: "prism.labs",
    description:
      "Sub-second ETH/USD marks aggregated across 9 venues, signed and threshold-encrypted. Buyers decrypt the latest window after an on-chain subscription.",
    sample:
      '{"pair":"ETH/USD","ts":1748459200,"mark":3412.88,"venues":9,"spread_bps":1.4,"window":"1s"}',
  },
  {
    uuid: 9002,
    title: "Instruction-tuning corpus (sample shard)",
    dataType: "Dataset",
    condition: "tiergate",
    terms: "Hold a Commercial-tier license",
    priceIp: null,
    subscribers: 87,
    creator: "0x4C9bFc96D7092B590d497a191826c3da2277C34b",
    creatorName: "corpus.dao",
    description:
      "A 50k-row instruction/response shard for LLM fine-tuning, license-gated to Commercial PIL holders. The vault releases the decryption key only to wallets holding the right license tier.",
    sample:
      '{"id":"row_00042","instruction":"Summarize the filing risk factors.","response":"…","tokens":318,"license":"commercial"}',
  },
  {
    uuid: 9003,
    title: "On-chain credit-risk scores",
    dataType: "Model output",
    condition: "subscription",
    terms: "Subscribe 25 IP / 30 days",
    priceIp: 25,
    subscribers: 41,
    creator: "0x85ceB332445Ca1D3d1975D6929Ca6Bed25195B2f",
    creatorName: "ledgerlens",
    description:
      "Per-address default-probability scores from a model trained on 3y of liquidations. Royalties route to the model's IP asset on every subscription.",
    sample: '{"address":"0x3a1f…","pd_30d":0.062,"tier":"BBB","model":"llens-v3","updated":1748452000}',
  },
  {
    uuid: 9004,
    title: "Satellite NDVI — Midwest crop belt",
    dataType: "Geospatial",
    condition: "composable",
    terms: "Commercial license AND active subscription",
    priceIp: 18,
    subscribers: 29,
    creator: "0xda704FAf61B2ffb37205D7eB8c1d26bD3090455F",
    creatorName: "orbital.idx",
    description:
      "Weekly normalized-difference vegetation index tiles, gated by a Composable condition: the buyer must BOTH hold a commercial license AND maintain an active subscription.",
    sample: '{"region":"US-MW","week":21,"ndvi_mean":0.71,"tiles":1280,"crs":"EPSG:4326"}',
  },
  {
    uuid: 9005,
    title: "DEX liquidation alpha stream",
    dataType: "Signals",
    condition: "subscription",
    terms: "Subscribe 12 IP / 30 days",
    priceIp: 12,
    subscribers: 156,
    creator: "0x36Fb2E2D10efd1e905B7779a684f34b9C775B62b",
    creatorName: "mev.kitchen",
    description:
      "Forward-looking liquidation pressure signals across major lending markets, refreshed each block and threshold-encrypted to subscribers.",
    sample: '{"market":"aave-v3","at_risk_usd":4193000,"health_p5":1.02,"horizon":"3blocks"}',
  },
  {
    uuid: 9006,
    title: "Redacted M&A diligence memo",
    dataType: "Document",
    condition: "tiergate",
    terms: "Hold an Enterprise-tier license",
    priceIp: null,
    subscribers: 12,
    creator: "0x74f2F94E7867B07ecDFBcc667050cBEC1de2800b",
    creatorName: "northgate.partners",
    description:
      "A diligence memo released only to Enterprise license holders. CDR provisions the key; the buyer holds plaintext after decryption (no runtime compute).",
    sample: '{"deal":"Project Atlas","ev_usd":"1.4B","synergies_usd":"180M","risk":"medium","pages":42}',
  },
];

/** One shared in-memory kit, pre-seeded so `accessVault(uuid)` returns each vault's bytes. */
export const mockKit = createMockCdrKit({ readDelayMs: 2600, threshold: 5 });
for (const v of seedVaults) {
  void mockKit.writeVaultData({ uuid: v.uuid, dataKey: new TextEncoder().encode(v.sample) });
}

export const vaultByUuid = (uuid: number) => seedVaults.find((v) => v.uuid === uuid);
