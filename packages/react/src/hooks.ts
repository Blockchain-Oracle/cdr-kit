"use client";
import { useCallback, useMemo, useState } from "react";
import { usePublicClient, useWalletClient, useReadContract } from "wagmi";
import type { Hex, PublicClient, WalletClient } from "viem";
import {
  createCdrKitClient,
  accessVault,
  subscribeAndAccess,
  createVault,
  type CdrKitClient,
  type AccessStep,
} from "@cdr-kit/core";
import { cdrKitVaultAbi, aeneid } from "@cdr-kit/contracts";
import { useCdrConfig } from "./provider.js";

/** Build a CdrKitClient from the connected wagmi public/wallet clients. */
export function useCdrClient(): CdrKitClient | undefined {
  const { apiUrl } = useCdrConfig();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  return useMemo(() => {
    if (!publicClient) return undefined;
    return createCdrKitClient({
      apiUrl,
      publicClient: publicClient as unknown as PublicClient,
      walletClient: walletClient as unknown as WalletClient | undefined,
    });
  }, [apiUrl, publicClient, walletClient]);
}

export type ReadStatus = "idle" | "collecting-partials" | "ready" | "error";

/** Read + decrypt a vault. Exposes status so UIs can surface the (tens-of-seconds) wait. */
export function useAccessVault(uuid: number) {
  const client = useCdrClient();
  const [status, setStatus] = useState<ReadStatus>("idle");
  const [data, setData] = useState<Uint8Array>();
  const [error, setError] = useState<Error>();

  const access = useCallback(
    async (accessAuxData?: Hex) => {
      if (!client) throw new Error("cdr-kit: client not ready (connect a wallet)");
      setStatus("collecting-partials");
      setError(undefined);
      try {
        const out = await accessVault(client, { uuid, accessAuxData });
        setData(out);
        setStatus("ready");
        return out;
      } catch (e) {
        setError(e as Error);
        setStatus("error");
        throw e;
      }
    },
    [client, uuid],
  );

  return { access, status, data, error };
}

/** Subscribe (pay) then access — the 2-step flow, with progress. */
export function useSubscribeAndAccess(uuid: number, subscriptionCondition: Hex = aeneid.subscriptionCondition as Hex) {
  const client = useCdrClient();
  const [status, setStatus] = useState<AccessStep | "idle" | "error">("idle");
  const [data, setData] = useState<Uint8Array>();

  const run = useCallback(
    async (p: { periods: bigint; maxPricePerPeriod: bigint; value: bigint; accessAuxData?: Hex }) => {
      if (!client) throw new Error("cdr-kit: client not ready (connect a wallet)");
      try {
        const out = await subscribeAndAccess(client, { subscriptionCondition, uuid, ...p, onProgress: setStatus });
        setData(out);
        return out;
      } catch (e) {
        setStatus("error");
        throw e;
      }
    },
    [client, uuid, subscriptionCondition],
  );

  return { run, status, data };
}

/** Create a vault via the CdrKitVault factory. */
export function useCreateVault() {
  const client = useCdrClient();
  return useCallback(
    (params: Omit<Parameters<typeof createVault>[1], "vault"> & { vault?: Hex }) => {
      if (!client) throw new Error("cdr-kit: client not ready (connect a wallet)");
      return createVault(client, { vault: aeneid.cdrKitVault as Hex, ...params });
    },
    [client],
  );
}

/** Read a creator's vault token IDs from the factory. */
export function useCreatorVaults(creator?: Hex) {
  return useReadContract({
    address: aeneid.cdrKitVault as Hex,
    abi: cdrKitVaultAbi,
    functionName: "getCreatorVaults",
    args: creator ? [creator] : undefined,
    query: { enabled: Boolean(creator) },
  });
}
