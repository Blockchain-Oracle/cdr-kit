import { encodeAbiParameters, type Hex } from "viem";
import { resolveAddresses } from "@cdr-kit/contracts";
import type { CdrAgent } from "./agent.js";
import { log } from "./logger.js";

/** Internal: lazy-load @cdr-kit/story + build a StoryClient from the agent's existing wallet. */
async function loadStory(agent: CdrAgent): Promise<{
  story: typeof import("@cdr-kit/story");
  client: import("@cdr-kit/story").StoryClient;
}> {
  let story: typeof import("@cdr-kit/story");
  try {
    story = await import("@cdr-kit/story");
  } catch {
    throw new Error(
      "cdr-kit/agent: @cdr-kit/story is required for Story IP integration. Install it: pnpm add @cdr-kit/story @story-protocol/core-sdk",
    );
  }
  if (!agent.client.walletClient?.account) {
    throw new Error("cdr-kit/agent: a wallet client is required for Story IP integration");
  }
  const client = await story.createStoryClient({
    account: agent.client.walletClient.account as unknown as { address: Hex },
    chainId: agent.network === "aeneid" ? 1315 : undefined,
  });
  return { story, client };
}

/** Register an NFT as a Story IP asset. Supports both `mint` and `minted` variants; optionally
 *  registers + attaches PIL terms in the same tx via `licenseTermsData`. */
export async function registerIpAsset(
  agent: CdrAgent,
  params: {
    nft:
      | { type: "mint"; spgNftContract: Hex; recipient?: Hex; allowDuplicates?: boolean }
      | { type: "minted"; nftContract: Hex; tokenId: bigint };
    ipMetadata?: { ipMetadataURI?: string; ipMetadataHash?: Hex; nftMetadataURI?: string; nftMetadataHash?: Hex };
    licenseTermsData?: { terms: unknown; licensingConfig?: unknown }[];
  },
): Promise<{ ipId: Hex; tokenId: bigint; licenseTermsIds?: bigint[]; txHash: Hex }> {
  const { story, client } = await loadStory(agent);
  log.info({ kind: params.nft.type }, "register IP asset");
  return story.registerIpAsset(client, params);
}

export async function attachLicenseTerms(
  agent: CdrAgent,
  params: { ipId: Hex; licenseTermsId: bigint; licenseTemplate?: Hex },
): Promise<{ txHash: Hex }> {
  const { story, client } = await loadStory(agent);
  log.info({ ipId: params.ipId, termsId: params.licenseTermsId }, "attach license terms");
  return story.attachLicenseTerms(client, params);
}

/** Register a derivative IP — child inherits parent terms. License-token mode passes tokens;
 *  parent-terms mode passes licenseTermsIds (mint-and-attach in one step). */
export async function registerDerivative(
  agent: CdrAgent,
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
  const { story, client } = await loadStory(agent);
  log.info({ child: params.childIpId, parents: params.parentIpIds.length }, "register derivative");
  return story.registerDerivative(client, params);
}

/** Register fresh PIL license terms (without attaching to an IP). Returns the new licenseTermsId. */
export async function registerPilTerms(
  agent: CdrAgent,
  params: { terms: unknown; licensingConfig?: unknown },
): Promise<{ licenseTermsId: bigint; txHash: Hex }> {
  const { story, client } = await loadStory(agent);
  log.info("register PIL terms");
  return story.registerPilTerms(client, params);
}

/** Wrap native IP into WIP (Wrapped IP) — required before paying royalties via the RoyaltyModule. */
export async function wrapIp(agent: CdrAgent, params: { amountWei: bigint }): Promise<{ txHash: Hex }> {
  const { story, client } = await loadStory(agent);
  log.info({ amount: params.amountWei }, "wrap IP → WIP");
  return story.wrapIp(client, params);
}

/** Approve a spender (typically the RoyaltyModule) to pull `amountWei` of WIP from this wallet. */
export async function approveWip(
  agent: CdrAgent,
  params: { spender: Hex; amountWei: bigint },
): Promise<{ txHash: Hex }> {
  const { story, client } = await loadStory(agent);
  log.info({ spender: params.spender, amount: params.amountWei }, "approve WIP");
  return story.approveWip(client, params);
}

export async function mintLicenseTokens(
  agent: CdrAgent,
  params: {
    licensorIpId: Hex;
    licenseTermsId: bigint;
    amount?: bigint;
    receiver?: Hex;
    maxMintingFee?: bigint;
    maxRevenueShare?: number;
  },
): Promise<{ licenseTokenIds: bigint[]; txHash: Hex }> {
  const { story, client } = await loadStory(agent);
  log.info({ licensor: params.licensorIpId, amount: params.amount ?? 1n }, "mint license tokens");
  return story.mintLicenseTokens(client, params);
}

/** Agent-as-publisher one-shot: register IP + attach PIL terms + create license-gated CDR vault
 *  + write encrypted data. Returns the chain of artifacts a buyer needs to subscribe + read. */
export async function publish(
  agent: CdrAgent,
  params: {
    data: Uint8Array;
    spgNftContract: Hex;
    pilTerms: unknown;
    ipMetadata?: { ipMetadataURI?: string; ipMetadataHash?: Hex; nftMetadataURI?: string; nftMetadataHash?: Hex };
  },
): Promise<{
  ipId: Hex;
  tokenId: bigint;
  licenseTermsId: bigint;
  vaultUuid: number;
  vaultTxHash: Hex;
  ipRegisterTxHash: Hex;
  writeTxHash: Hex;
}> {
  const { story, client: storyClient } = await loadStory(agent);
  log.info({ bytes: params.data.length }, "publish (one-shot)");

  const reg = await story.registerIpAsset(storyClient, {
    nft: { type: "mint", spgNftContract: params.spgNftContract },
    ipMetadata: params.ipMetadata,
    licenseTermsData: [{ terms: params.pilTerms }],
  });
  if (!reg.licenseTermsIds || reg.licenseTermsIds.length === 0) {
    throw new Error("publish: licenseTermsIds missing from registerIpAsset response");
  }
  const licenseTermsId = reg.licenseTermsIds[0]!;

  const addrs = resolveAddresses(agent.network);
  const readConfig = encodeAbiParameters(
    [{ type: "address" }, { type: "uint256" }],
    [reg.ipId, licenseTermsId],
  );
  const vaultTxHash = await agent.createVault({
    readConditionAddr: addrs.licenseReadCondition as Hex,
    readConfig,
    licenseTermsId,
  });

  const receipt = await agent.client.publicClient.waitForTransactionReceipt({ hash: vaultTxHash });
  if (!receipt.logs[0]?.topics[2]) throw new Error("publish: VaultCreated event not found in receipt");
  const uuid = Number(BigInt(receipt.logs[0].topics[2]));

  const writeTxHash = await agent.writeVaultData({ uuid, dataKey: params.data });

  return {
    ipId: reg.ipId,
    tokenId: reg.tokenId,
    licenseTermsId,
    vaultUuid: uuid,
    vaultTxHash,
    ipRegisterTxHash: reg.txHash,
    writeTxHash,
  };
}
