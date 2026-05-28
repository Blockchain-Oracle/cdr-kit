"use client";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { getAbiItem, type Hex } from "viem";
import { cdrKitVaultAbi, aeneid } from "@cdr-kit/contracts";
import type { VaultCreatedEvent } from "./hooks.js";

const VAULT_CREATED = getAbiItem({ abi: cdrKitVaultAbi, name: "VaultCreated" });
/** Free-RPC `eth_getLogs` window guard — page the scan in bounded ranges (D11). */
const MAX_RANGE = 9_000n;

/**
 * Historical vault discovery: a bounded, paginated `getLogs` over the factory's `VaultCreated`
 * events (D11 — there is no "who-read" signal; discovery is the create event). Returns the same
 * shape as the live-feed {@link useVaultEvents}; use this for the browse/marketplace list.
 */
export function useDiscoverVaults(opts: { fromBlock?: bigint } = {}) {
  const client = usePublicClient();
  const [vaults, setVaults] = useState<VaultCreatedEvent[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (!client) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const latest = await client.getBlockNumber();
        const start = opts.fromBlock ?? (latest > MAX_RANGE ? latest - MAX_RANGE : 0n);
        const out: VaultCreatedEvent[] = [];
        for (let from = start; from <= latest; from += MAX_RANGE + 1n) {
          const to = from + MAX_RANGE > latest ? latest : from + MAX_RANGE;
          const logs = await client.getLogs({
            address: aeneid.cdrKitVault as Hex,
            event: VAULT_CREATED,
            fromBlock: from,
            toBlock: to,
          });
          for (const l of logs) {
            const a = (l as { args: { tokenId: bigint; uuid: number; ipId: Hex; creator: Hex } }).args;
            out.push({ tokenId: a.tokenId, uuid: Number(a.uuid), ipId: a.ipId, creator: a.creator });
          }
        }
        if (active) setVaults(out);
      } catch (e) {
        if (active) setError(e as Error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [client, opts.fromBlock]);

  return { vaults, isLoading, error };
}
