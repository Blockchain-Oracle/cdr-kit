/**
 * @cdr-kit/story — thin TypeScript wrappers over @story-protocol/core-sdk.
 *
 * Designed for cdr-kit's "agent-as-publisher" surface: each function returns a single normalized
 * shape `{ ...result, txHash }` (or just `{ txHash }`) so agent code doesn't have to read the
 * SDK's typed responses to know what happened. PILFlavor is re-exported as-is for ergonomic
 * `licenseTermsData: [{ terms: PILFlavor.commercialRemix({...}) }]` composition.
 *
 * @story-protocol/core-sdk is a PEER dep — callers must install it explicitly. Importing from
 * this package without the SDK installed will fail at the dynamic-import boundary in
 * `createStoryClient`, with a clear "install @story-protocol/core-sdk" error message.
 */
import { http, type Hex } from "viem";
import type {
  StoryClient as StoryClientT,
  RegisterIpResponse,
  RegisterPILResponse,
  AttachLicenseTermsResponse,
  MintLicenseTokensResponse,
  LinkDerivativeResponse,
} from "@story-protocol/core-sdk";

export { PILFlavor } from "@story-protocol/core-sdk";

/** Story Aeneid testnet (chain 1315). The only deployed network as of 2026-06-01. */
export const STORY_AENEID_CHAIN_ID = 1315;

/** Default Aeneid RPC if caller doesn't pass one. */
export const STORY_AENEID_RPC_URL = "https://aeneid.storyrpc.io";

/** Construct a StoryClient via the SDK's account-based factory. Aeneid by default.
 *
 *  The SDK requires a real viem-style transport — it does NOT auto-derive one from chainId.
 *  We build a default `http(rpcUrl)` transport so callers can omit `rpcUrl` for Aeneid; pass
 *  it explicitly for custom endpoints (private nodes, mainnet when it ships).
 */
export async function createStoryClient(opts: {
  account: { address: Hex; signMessage?: unknown; signTransaction?: unknown };
  rpcUrl?: string;
  chainId?: number;
}): Promise<StoryClientT> {
  const { StoryClient } = await loadSdk();
  const transport = http(opts.rpcUrl ?? STORY_AENEID_RPC_URL);
  return StoryClient.newClientUseAccount({
    account: opts.account as never,
    transport: transport as never,
    chainId: (opts.chainId ?? STORY_AENEID_CHAIN_ID) as never,
  });
}

async function loadSdk(): Promise<typeof import("@story-protocol/core-sdk")> {
  try {
    return await import("@story-protocol/core-sdk");
  } catch {
    throw new Error(
      "cdr-kit/story: @story-protocol/core-sdk is required but not installed. Install it with: pnpm add @story-protocol/core-sdk",
    );
  }
}

/* ============================================================ */
/* Type re-exports — what consumers actually want to pass        */
/* ============================================================ */

export type StoryClient = StoryClientT;

/* ============================================================ */
/* IP asset                                                      */
/* ============================================================ */

export interface RegisterIpAssetParams {
  /** Either mint a fresh NFT from an SPG collection OR adopt an existing NFT. */
  nft:
    | { type: "mint"; spgNftContract: Hex; recipient?: Hex; allowDuplicates?: boolean }
    | { type: "minted"; nftContract: Hex; tokenId: bigint };
  /** IP metadata + NFT metadata bundle (per Story spec). Pass at minimum `ipMetadataURI`. */
  ipMetadata?: {
    ipMetadataURI?: string;
    ipMetadataHash?: Hex;
    nftMetadataURI?: string;
    nftMetadataHash?: Hex;
  };
  /** Optional PIL terms to register + attach in the SAME tx (saves 2 calls). */
  licenseTermsData?: { terms: unknown; licensingConfig?: unknown }[];
  deadline?: bigint;
}

export async function registerIpAsset(
  client: StoryClient,
  params: RegisterIpAssetParams,
): Promise<{ ipId: Hex; tokenId: bigint; licenseTermsIds?: bigint[]; txHash: Hex }> {
  const res = (await client.ipAsset.registerIpAsset(params as never)) as RegisterIpResponse & {
    licenseTermsIds?: bigint[];
  };
  return {
    ipId: res.ipId as Hex,
    tokenId: res.tokenId as bigint,
    licenseTermsIds: res.licenseTermsIds,
    txHash: res.txHash as Hex,
  };
}

export async function registerDerivative(
  client: StoryClient,
  params: {
    childIpId: Hex;
    parentIpIds: Hex[];
    licenseTermsIds: bigint[];
    licenseTokenIds?: bigint[];
    maxMintingFee?: bigint;
    maxRts?: number;
    maxRevenueShare?: number;
  },
): Promise<{ txHash: Hex }> {
  const res = (await client.ipAsset.registerDerivative(params as never)) as LinkDerivativeResponse;
  return { txHash: res.txHash as Hex };
}

/* ============================================================ */
/* License                                                       */
/* ============================================================ */

export async function registerPilTerms(
  client: StoryClient,
  params: { terms: unknown; licensingConfig?: unknown },
): Promise<{ licenseTermsId: bigint; txHash: Hex }> {
  const res = (await client.license.registerPILTerms(params as never)) as RegisterPILResponse;
  return { licenseTermsId: res.licenseTermsId as bigint, txHash: res.txHash as Hex };
}

export async function attachLicenseTerms(
  client: StoryClient,
  params: { ipId: Hex; licenseTermsId: bigint; licenseTemplate?: Hex },
): Promise<{ txHash: Hex; success?: boolean }> {
  const res = (await client.license.attachLicenseTerms(params as never)) as AttachLicenseTermsResponse;
  return { txHash: res.txHash as Hex, success: res.success };
}

export async function mintLicenseTokens(
  client: StoryClient,
  params: {
    licensorIpId: Hex;
    licenseTermsId: bigint;
    amount?: bigint;
    receiver?: Hex;
    /** Max minting fee the caller is willing to pay (wei). Default 0 — only works on free terms. */
    maxMintingFee?: bigint;
    /** Max revenue share % (basis points). Default 0. */
    maxRevenueShare?: number;
    licenseTemplate?: Hex;
  },
): Promise<{ licenseTokenIds: bigint[]; txHash: Hex }> {
  const res = (await client.license.mintLicenseTokens({
    licensorIpId: params.licensorIpId,
    licenseTermsId: params.licenseTermsId,
    amount: params.amount ?? 1n,
    receiver: params.receiver,
    maxMintingFee: params.maxMintingFee ?? 0n,
    maxRevenueShare: params.maxRevenueShare ?? 0,
    licenseTemplate: params.licenseTemplate,
  } as never)) as MintLicenseTokensResponse;
  return { licenseTokenIds: (res.licenseTokenIds ?? []) as bigint[], txHash: res.txHash as Hex };
}

/* ============================================================ */
/* WIP (wrapped IP)                                              */
/* ============================================================ */

/** Wrap `amountWei` of native IP into WIP (the ERC-20 form Story's royalty module accepts). */
export async function wrapIp(client: StoryClient, params: { amountWei: bigint }): Promise<{ txHash: Hex }> {
  const res = await client.wipClient.deposit({ amount: params.amountWei } as never);
  return { txHash: (res as { txHash: Hex }).txHash };
}

/** Approve `spender` to pull `amountWei` of WIP from this wallet (needed before paying royalty). */
export async function approveWip(
  client: StoryClient,
  params: { spender: Hex; amountWei: bigint },
): Promise<{ txHash: Hex }> {
  const res = await client.wipClient.approve({ spender: params.spender, amount: params.amountWei } as never);
  return { txHash: (res as { txHash: Hex }).txHash };
}
