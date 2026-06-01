"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePublicClient, useReadContract, useWalletClient } from "wagmi";
import type { Hex } from "viem";
import {
  aeneid,
  deadManSwitchConditionAbi,
  conditionalEscrowConditionAbi,
  timeWindowConditionAbi,
} from "@cdr-kit/contracts";
import {
  createPinataStorage,
  createSupabaseStorage,
  createReadOnlyGatewayStorage,
  createIpfsStorage,
  createMemoryStorage,
  type CdrStorageProvider,
} from "@cdr-kit/core";

/* ============================================================ */
/* TimeWindowCondition                                           */
/* ============================================================ */

export interface TimeWindowState {
  startTs?: bigint;
  endTs?: bigint;
  blockBased?: boolean;
  /** True iff right now is inside `[startTs, endTs]`. */
  isOpen: boolean;
  /** ms until the window opens (0 if already open or unconfigured). */
  opensInMs: number;
  /** ms until the window closes (0 if open-ended `endTs=0`, or already closed/unconfigured). */
  closesInMs: number;
  isLoading: boolean;
}

/** Read TimeWindowCondition state for a uuid. Counts down to open + to close in real time. */
export function useTimeWindowState(uuid: number, address: Hex = aeneid.timeWindowCondition as Hex): TimeWindowState {
  const read = useReadContract({
    address,
    abi: timeWindowConditionAbi,
    functionName: "window",
    args: [uuid],
  });
  const w = read.data as readonly [bigint, bigint, boolean] | undefined;
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  return useMemo(() => {
    if (!w) return { isOpen: false, opensInMs: 0, closesInMs: 0, isLoading: read.isLoading };
    const [startTs, endTs, blockBased] = w;
    if (blockBased) {
      // Block-based: can't compute ms client-side without RPC roundtrip per tick. Surface fields raw.
      return { startTs, endTs, blockBased, isOpen: false, opensInMs: 0, closesInMs: 0, isLoading: read.isLoading };
    }
    const nowBig = BigInt(now);
    const isOpen = nowBig >= startTs && (endTs === 0n || nowBig <= endTs);
    const opensInMs = nowBig < startTs ? Number(startTs - nowBig) * 1000 : 0;
    const closesInMs = endTs === 0n ? 0 : nowBig <= endTs ? Number(endTs - nowBig) * 1000 : 0;
    return { startTs, endTs, blockBased, isOpen, opensInMs, closesInMs, isLoading: read.isLoading };
  }, [w, now, read.isLoading]);
}

/* ============================================================ */
/* DeadManSwitchCondition                                        */
/* ============================================================ */

export interface DeadManTimer {
  unlocksAt?: bigint;
  duration?: bigint;
  blockBased?: boolean;
  /** ms remaining until unlock; 0 once expired or unconfigured. */
  remainingMs: number;
  isUnlocked: boolean;
  /** True when < 25% of the original window remains — UI should show an "extend now" warning. */
  isCritical: boolean;
  /** Creator-side: bump the unlock countdown back to `now + duration`. */
  poke: () => Promise<Hex>;
  isLoading: boolean;
}

export function useDeadManTimer(uuid: number, address: Hex = aeneid.deadManSwitchCondition as Hex): DeadManTimer {
  const read = useReadContract({
    address,
    abi: deadManSwitchConditionAbi,
    functionName: "cfg",
    args: [uuid],
  });
  const c = read.data as readonly [bigint, bigint, boolean, boolean, boolean] | undefined;
  const { data: walletClient } = useWalletClient();

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const poke = useCallback(async () => {
    if (!walletClient) throw new Error("connect a wallet to poke");
    return walletClient.writeContract({
      address,
      abi: deadManSwitchConditionAbi,
      functionName: "poke",
      args: [uuid],
      chain: walletClient.chain ?? null,
      account: walletClient.account!,
    });
  }, [walletClient, address, uuid]);

  return useMemo(() => {
    if (!c) return { remainingMs: 0, isUnlocked: false, isCritical: false, poke, isLoading: read.isLoading };
    const [unlocksAt, duration, blockBased] = c;
    if (blockBased) {
      // Same caveat as TimeWindow — block.number can't be ticked client-side cheaply.
      return { unlocksAt, duration, blockBased, remainingMs: 0, isUnlocked: false, isCritical: false, poke, isLoading: read.isLoading };
    }
    const nowBig = BigInt(now);
    const isUnlocked = nowBig >= unlocksAt;
    const remainingMs = isUnlocked ? 0 : Number(unlocksAt - nowBig) * 1000;
    const fullMs = Number(duration) * 1000;
    const isCritical = !isUnlocked && remainingMs < fullMs * 0.25;
    return { unlocksAt, duration, blockBased, remainingMs, isUnlocked, isCritical, poke, isLoading: read.isLoading };
  }, [c, now, poke, read.isLoading]);
}

/* ============================================================ */
/* MultiSigCondition surface lives in ./multi-sig-hooks.ts       */
/* (extracted to keep condition-hooks.ts under the 400-line cap) */
/* ============================================================ */

/* ============================================================ */
/* ConditionalEscrowCondition                                    */
/* ============================================================ */

export interface EscrowState {
  seller?: Hex;
  price?: bigint;
  timeoutSecs?: bigint;
  arbiter?: Hex;
  paidAt: bigint;
  delivered: boolean;
  /** seller can claim unilaterally once block.timestamp >= paidAt + timeoutSecs. */
  timeoutAt?: bigint;
  /** ms until seller may force-close (0 if not paid or already lapsed). */
  timeoutInMs: number;
  /** Buyer confirms delivery → seller paid, buyer reads. */
  confirmDelivery: () => Promise<Hex>;
  /** Buyer pays the listing price (or any amount ≥ price; excess refunded on-chain). */
  pay: () => Promise<Hex>;
  isLoading: boolean;
}

export function useEscrowState(
  uuid: number,
  buyer: Hex | undefined,
  address: Hex = aeneid.conditionalEscrowCondition as Hex,
): EscrowState {
  const listing = useReadContract({
    address,
    abi: conditionalEscrowConditionAbi,
    functionName: "listing",
    args: [uuid],
  });
  const paidAtRead = useReadContract({
    address,
    abi: conditionalEscrowConditionAbi,
    functionName: "paidAt",
    args: buyer ? [uuid, buyer] : undefined,
    query: { enabled: Boolean(buyer) },
  });
  const deliveredRead = useReadContract({
    address,
    abi: conditionalEscrowConditionAbi,
    functionName: "delivered",
    args: buyer ? [uuid, buyer] : undefined,
    query: { enabled: Boolean(buyer) },
  });
  const { data: walletClient } = useWalletClient();
  const l = listing.data as readonly [Hex, bigint, bigint, Hex] | undefined;
  const paidAt = (paidAtRead.data as bigint | undefined) ?? 0n;
  const delivered = (deliveredRead.data as boolean | undefined) ?? false;

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const confirmDelivery = useCallback(async () => {
    if (!walletClient) throw new Error("connect a wallet to confirm delivery");
    return walletClient.writeContract({
      address,
      abi: conditionalEscrowConditionAbi,
      functionName: "confirmDelivery",
      args: [uuid],
      chain: walletClient.chain ?? null,
      account: walletClient.account!,
    });
  }, [walletClient, address, uuid]);

  const pay = useCallback(async () => {
    if (!walletClient) throw new Error("connect a wallet to pay");
    if (!l) throw new Error("escrow listing not loaded");
    return walletClient.writeContract({
      address,
      abi: conditionalEscrowConditionAbi,
      functionName: "pay",
      args: [uuid],
      value: l[1],
      chain: walletClient.chain ?? null,
      account: walletClient.account!,
    });
  }, [walletClient, address, uuid, l]);

  return useMemo(() => {
    if (!l) {
      return {
        paidAt,
        delivered,
        timeoutInMs: 0,
        confirmDelivery,
        pay,
        isLoading: listing.isLoading || paidAtRead.isLoading || deliveredRead.isLoading,
      };
    }
    const [seller, price, timeoutSecs, arbiter] = l;
    const timeoutAt = paidAt === 0n ? undefined : paidAt + timeoutSecs;
    const nowBig = BigInt(now);
    const timeoutInMs = timeoutAt && nowBig < timeoutAt ? Number(timeoutAt - nowBig) * 1000 : 0;
    return {
      seller,
      price,
      timeoutSecs,
      arbiter,
      paidAt,
      delivered,
      timeoutAt,
      timeoutInMs,
      confirmDelivery,
      pay,
      isLoading: listing.isLoading || paidAtRead.isLoading || deliveredRead.isLoading,
    };
  }, [l, paidAt, delivered, now, confirmDelivery, pay, listing.isLoading, paidAtRead.isLoading, deliveredRead.isLoading]);
}

/* ============================================================ */
/* Seller / arbiter / creator-rotation actions (write-only)      */
/*                                                               */
/* These complete the role-coverage for the new 0.5 conditions   */
/* so a dashboard can show seller-side escrow claim, arbiter      */
/* refund, and multi-sig signer rotation alongside the existing   */
/* buyer-side hooks. Each returns an async callback ready to wire */
/* to a button onClick.                                          */
/* ============================================================ */

/** Seller-side: claim escrow funds + grant buyer read after listing timeout lapsed.
 *  Caller must be the configured seller for the listing. */
export function useEscrowClaimTimeout(
  uuid: number,
  buyer: Hex | undefined,
  address: Hex = aeneid.conditionalEscrowCondition as Hex,
): () => Promise<Hex> {
  const { data: walletClient } = useWalletClient();
  return useCallback(async () => {
    if (!walletClient) throw new Error("connect a wallet to claim escrow timeout");
    if (!buyer) throw new Error("buyer address required");
    return walletClient.writeContract({
      address,
      abi: conditionalEscrowConditionAbi,
      functionName: "claimAfterTimeout",
      args: [uuid, buyer],
      chain: walletClient.chain ?? null,
      account: walletClient.account!,
    });
  }, [walletClient, address, uuid, buyer]);
}

/** Arbiter-side: refund a buyer who paid but disputes delivery. Resets paidAt to 0
 *  (buyer can re-pay). Caller must be the configured arbiter; `address(0)` arbiter = throws. */
export function useEscrowRefund(
  uuid: number,
  buyer: Hex | undefined,
  address: Hex = aeneid.conditionalEscrowCondition as Hex,
): () => Promise<Hex> {
  const { data: walletClient } = useWalletClient();
  return useCallback(async () => {
    if (!walletClient) throw new Error("connect a wallet to refund");
    if (!buyer) throw new Error("buyer address required");
    return walletClient.writeContract({
      address,
      abi: conditionalEscrowConditionAbi,
      functionName: "arbiterRefund",
      args: [uuid, buyer],
      chain: walletClient.chain ?? null,
      account: walletClient.account!,
    });
  }, [walletClient, address, uuid, buyer]);
}

/* ============================================================ */
/* useStorageBackend                                             */
/* ============================================================ */

/**
 * Config-driven storage provider factory. Lets a dashboard switch backends at runtime via a
 * JSON config (e.g. user picks "Pinata" + pastes their JWT, vs. picks "Supabase" + project URL +
 * service key). Memoized so the provider identity is stable across re-renders.
 */
export type StorageBackendConfig =
  | { kind: "memory" }
  | { kind: "pinata"; jwt: string; gatewayUrl?: string }
  | { kind: "supabase"; supabaseUrl: string; key: string; bucket: string; pathPrefix?: string; bucketIsPublic?: boolean }
  | { kind: "gateway"; gatewayUrl: string }
  | { kind: "ipfs"; addUrl: string; gatewayUrl: string; headers?: Record<string, string> };

export function useStorageBackend(config: StorageBackendConfig | undefined): CdrStorageProvider | undefined {
  return useMemo(() => {
    if (!config) return undefined;
    switch (config.kind) {
      case "memory":
        return createMemoryStorage();
      case "pinata":
        return createPinataStorage({ jwt: config.jwt, gatewayUrl: config.gatewayUrl });
      case "supabase":
        return createSupabaseStorage(config);
      case "gateway":
        return createReadOnlyGatewayStorage({ gatewayUrl: config.gatewayUrl });
      case "ipfs":
        return createIpfsStorage(config);
    }
  }, [config]);
}

// Suppress an unused-import warning when nobody uses usePublicClient in this file directly.
void usePublicClient;
