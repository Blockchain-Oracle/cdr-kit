"use client";
import { useCallback, useEffect, useState } from "react";
import { useWalletClient } from "wagmi";
import type { Hex } from "viem";

/**
 * React hooks for the Story IP integration that ships from `@cdr-kit/story` as an optional peer
 * dep. Each hook lazy-loads the SDK on first call so dashboards that don't publish original IP
 * don't pay the dep cost. Pair with `usePublish` for the agent-as-publisher one-shot — that's
 * the headline 0.5 DX win these hooks make accessible from React.
 */

type StoryClientLike = {
  ipAsset: { registerIpAsset: (req: unknown) => Promise<unknown> };
  license: {
    attachLicenseTerms: (req: unknown) => Promise<unknown>;
    mintLicenseTokens: (req: unknown) => Promise<unknown>;
  };
};

type StoryMod = typeof import("@cdr-kit/story");

let storyModulePromise: Promise<StoryMod> | null = null;
async function loadStoryModule(): Promise<StoryMod> {
  if (!storyModulePromise) {
    storyModulePromise = import("@cdr-kit/story").catch(() => {
      storyModulePromise = null;
      throw new Error(
        "@cdr-kit/story is required for Story IP hooks. Install: pnpm add @cdr-kit/story @story-protocol/core-sdk",
      );
    });
  }
  return storyModulePromise;
}

/** Returns a memoized StoryClient bound to the connected wagmi wallet. `undefined` until the
 *  wallet connects + the lazy import resolves. */
export function useStoryClient(chainId = 1315): StoryClientLike | undefined {
  const { data: walletClient } = useWalletClient();
  const [client, setClient] = useState<StoryClientLike>();
  useEffect(() => {
    if (!walletClient?.account) {
      setClient(undefined);
      return;
    }
    let cancelled = false;
    loadStoryModule()
      .then(async (story) => {
        const c = await story.createStoryClient({
          account: walletClient.account as unknown as { address: Hex },
          chainId,
        });
        if (!cancelled) setClient(c as unknown as StoryClientLike);
      })
      .catch(() => {
        if (!cancelled) setClient(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [walletClient, chainId]);
  return client;
}

export interface RegisterIpParams {
  spgNftContract: Hex;
  recipient?: Hex;
  ipMetadataURI?: string;
  ipMetadataHash?: Hex;
}

/** Register a fresh NFT (via the SPG collection) as a Story IP asset. Pass the StoryClient from
 *  `useStoryClient()` — the callback delegates to it so the hook stays uniform with the others. */
export function useRegisterIp(client: StoryClientLike | undefined): {
  registerIp: (params: RegisterIpParams) => Promise<{ ipId: Hex; tokenId: bigint; txHash: Hex }>;
  isLoading: boolean;
  error?: Error;
} {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const registerIp = useCallback(
    async (params: RegisterIpParams) => {
      if (!client) throw new Error("StoryClient not ready — wrap with useStoryClient first");
      setLoading(true);
      setError(undefined);
      try {
        const res = (await client.ipAsset.registerIpAsset({
          nft: {
            type: "mint",
            spgNftContract: params.spgNftContract,
            recipient: params.recipient,
          },
          ipMetadata: {
            ipMetadataURI: params.ipMetadataURI,
            ipMetadataHash: params.ipMetadataHash,
          },
        })) as { ipId: Hex; tokenId: bigint; txHash: Hex };
        return res;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );
  return { registerIp, isLoading, error };
}

export interface MintLicenseParams {
  licensorIpId: Hex;
  licenseTermsId: bigint;
  amount?: bigint;
  receiver?: Hex;
  maxMintingFee?: bigint;
}

/** Mint Story license tokens against an IP's licenseTermsId. Buyer-side helper for the
 *  license-gated CDR flow. */
export function useMintLicenseToken(client: StoryClientLike | undefined): {
  mint: (params: MintLicenseParams) => Promise<{ licenseTokenIds: bigint[]; txHash: Hex }>;
  isLoading: boolean;
  error?: Error;
} {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const mint = useCallback(
    async (params: MintLicenseParams) => {
      if (!client) throw new Error("StoryClient not ready — wrap with useStoryClient first");
      setLoading(true);
      setError(undefined);
      try {
        const res = (await client.license.mintLicenseTokens({
          licensorIpId: params.licensorIpId,
          licenseTermsId: params.licenseTermsId,
          amount: params.amount ?? 1n,
          receiver: params.receiver,
          maxMintingFee: params.maxMintingFee ?? 0n,
          maxRevenueShare: 0,
        })) as { licenseTokenIds?: bigint[]; txHash: Hex };
        return { licenseTokenIds: res.licenseTokenIds ?? [], txHash: res.txHash };
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );
  return { mint, isLoading, error };
}

export interface AttachLicenseTermsParams {
  ipId: Hex;
  licenseTermsId: bigint;
  licenseTemplate?: Hex;
}

/** Attach existing PIL license terms to a Story IP asset. */
export function useAttachLicenseTerms(client: StoryClientLike | undefined): {
  attach: (params: AttachLicenseTermsParams) => Promise<{ txHash: Hex }>;
  isLoading: boolean;
  error?: Error;
} {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const attach = useCallback(
    async (params: AttachLicenseTermsParams) => {
      if (!client) throw new Error("StoryClient not ready — wrap with useStoryClient first");
      setLoading(true);
      setError(undefined);
      try {
        const res = (await client.license.attachLicenseTerms(params)) as { txHash: Hex };
        return { txHash: res.txHash };
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );
  return { attach, isLoading, error };
}

export interface PublishParams {
  data: Uint8Array;
  spgNftContract: Hex;
  pilTerms: unknown;
  ipMetadata?: {
    ipMetadataURI?: string;
    ipMetadataHash?: Hex;
    nftMetadataURI?: string;
    nftMetadataHash?: Hex;
  };
}

export interface PublishResult {
  ipId: Hex;
  tokenId: bigint;
  licenseTermsId: bigint;
  vaultUuid: number;
  vaultTxHash: Hex;
  ipRegisterTxHash: Hex;
  writeTxHash: Hex;
}

/**
 * Agent-as-publisher one-shot from React. Mirrors `agent.publish()` in `@cdr-kit/agent` — register
 * a fresh Story IP + attach commercial PIL terms + create a license-gated CDR vault + write the
 * encrypted secret, all from one call. The wagmi wallet signs every step.
 *
 * Requires both `@cdr-kit/agent` (already a dep transitively) AND `@cdr-kit/story` peer dep.
 * Currently delegates to the agent layer for the actual orchestration — pass a `CdrAgent`
 * instance you constructed from the connected wallet's account.
 */
export function usePublish(): {
  publish: (agent: { publish: (p: PublishParams) => Promise<PublishResult> }, params: PublishParams) => Promise<PublishResult>;
  isLoading: boolean;
  error?: Error;
  result?: PublishResult;
} {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [result, setResult] = useState<PublishResult>();
  const publish = useCallback(
    async (agent: { publish: (p: PublishParams) => Promise<PublishResult> }, params: PublishParams) => {
      setLoading(true);
      setError(undefined);
      try {
        const res = await agent.publish(params);
        setResult(res);
        return res;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );
  return { publish, isLoading, error, result };
}
