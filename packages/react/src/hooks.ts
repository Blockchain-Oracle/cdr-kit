"use client";
import { useCallback, useMemo, useState } from "react";
import { usePublicClient, useWalletClient, useReadContract, useWatchContractEvent } from "wagmi";
import type { Hex, PublicClient, WalletClient } from "viem";
import {
  createCdrKitClient,
  accessVault,
  subscribeAndAccess,
  createVault,
  CdrErrors,
  type CdrKitClient,
  type CdrState,
  type CdrStatus,
  type CdrError,
} from "@cdr-kit/core";
import { cdrKitVaultAbi, aeneid } from "@cdr-kit/contracts";
import { useCdrConfig } from "./provider.js";

/** Build a CdrKitClient from the connected wagmi clients (undefined in mock mode). */
export function useCdrClient(): CdrKitClient | undefined {
  const { apiUrl, mockKit } = useCdrConfig();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  return useMemo(() => {
    if (mockKit || !publicClient) return undefined;
    return createCdrKitClient({
      apiUrl,
      publicClient: publicClient as unknown as PublicClient,
      walletClient: walletClient as unknown as WalletClient | undefined,
    });
  }, [apiUrl, mockKit, publicClient, walletClient]);
}

function requireClient(c: CdrKitClient | undefined): CdrKitClient {
  if (!c) throw CdrErrors.walletRequired();
  return c;
}

/** Read + decrypt a vault. Exposes the discriminated status + read progress (D17 contract). */
export function useAccessVault(uuid: number) {
  const { mockKit } = useCdrConfig();
  const client = useCdrClient();
  const [state, setState] = useState<CdrState<Uint8Array>>({ status: "idle" });

  const access = useCallback(
    async (accessAuxData?: Hex) => {
      setState({ status: "collecting-partials" });
      try {
        const out = mockKit
          ? await mockKit.accessVault({ uuid, onProgress: (progress) => setState({ status: "collecting-partials", progress }) })
          : await accessVault(requireClient(client), {
              uuid,
              accessAuxData,
              onProgress: (step) => setState({ status: step === "ready" ? "ready" : "collecting-partials" }),
            });
        setState({ status: "ready", data: out });
        return out;
      } catch (e) {
        setState({ status: "error", error: e as CdrError });
        throw e;
      }
    },
    [mockKit, client, uuid],
  );

  return { access, status: state.status, data: state.data, error: state.error, progress: state.progress };
}

/** Subscribe (pay) then access — the 2-step flow, with progress. */
export function useSubscribeAndAccess(uuid: number, subscriptionCondition: Hex = aeneid.subscriptionCondition as Hex) {
  const { mockKit } = useCdrConfig();
  const client = useCdrClient();
  const [status, setStatus] = useState<CdrStatus>("idle");
  const [data, setData] = useState<Uint8Array>();

  const run = useCallback(
    async (p: { periods: bigint; maxPricePerPeriod: bigint; value: bigint; accessAuxData?: Hex }) => {
      try {
        const out = mockKit
          ? await mockKit.subscribeAndAccess({ uuid, onProgress: setStatus })
          : await subscribeAndAccess(requireClient(client), { subscriptionCondition, uuid, ...p, onProgress: setStatus });
        setData(out);
        setStatus("ready");
        return out;
      } catch (e) {
        setStatus("error");
        throw e;
      }
    },
    [mockKit, client, uuid, subscriptionCondition],
  );

  return { run, status, data };
}

/** Create a vault via the CdrKitVault factory (live mode). */
export function useCreateVault() {
  const client = useCdrClient();
  return useCallback(
    (params: Omit<Parameters<typeof createVault>[1], "vault"> & { vault?: Hex }) =>
      createVault(requireClient(client), { vault: aeneid.cdrKitVault as Hex, ...params }),
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

/** Vault metadata (uuid, ipId, creator, licenseTermsId) resolved from a uuid via the factory. */
export function useVault(uuid: number) {
  const token = useReadContract({
    address: aeneid.cdrKitVault as Hex,
    abi: cdrKitVaultAbi,
    functionName: "vaultToToken",
    args: [uuid],
  });
  const tokenId = token.data as bigint | undefined;
  const info = useReadContract({
    address: aeneid.cdrKitVault as Hex,
    abi: cdrKitVaultAbi,
    functionName: "getVaultInfo",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });
  return { tokenId, info: info.data, isLoading: token.isLoading || info.isLoading, error: token.error ?? info.error };
}

export interface VaultCreatedEvent {
  tokenId: bigint;
  uuid: number;
  ipId: Hex;
  creator: Hex;
}

/** Live feed of VaultCreated events from the factory (powers a discovery / activity list). */
export function useVaultEvents() {
  const [events, setEvents] = useState<VaultCreatedEvent[]>([]);
  useWatchContractEvent({
    address: aeneid.cdrKitVault as Hex,
    abi: cdrKitVaultAbi,
    eventName: "VaultCreated",
    onLogs: (logs) => {
      const next = logs.map((l) => {
        const a = (l as { args: { tokenId: bigint; uuid: number; ipId: Hex; creator: Hex } }).args;
        return { tokenId: a.tokenId, uuid: Number(a.uuid), ipId: a.ipId, creator: a.creator };
      });
      setEvents((prev) => [...prev, ...next]);
    },
  });
  return events;
}
