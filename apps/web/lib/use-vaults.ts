"use client";

import { useMemo } from "react";
import { useCdrConfig, useDiscoverVaults } from "@cdr-kit/react";
import { seedVaults, vaultByUuid, type SeedVault } from "@/mock/seed";
import { mergeLiveVaults, liveVaultToSeed } from "./live-vaults";

/** Live ⟺ no in-memory mock kit (the provider gates on `NEXT_PUBLIC_CDR_API_URL`). */
export function useIsLive(): boolean {
  return !useCdrConfig().mockKit;
}

/** Marketplace list: mock seed offline, or the seeded + discovered on-chain vaults when live. */
export function useVaults(): { vaults: SeedVault[]; isLoading: boolean; isLive: boolean } {
  const isLive = useIsLive();
  const { vaults: discovered, isLoading } = useDiscoverVaults({ enabled: isLive });
  return useMemo(() => {
    if (!isLive) return { vaults: seedVaults, isLoading: false, isLive };
    return { vaults: mergeLiveVaults(discovered), isLoading, isLive };
  }, [isLive, discovered, isLoading]);
}

/** Vault-detail metadata: mock seed offline, or the on-chain label map when live. */
export function useVaultMeta(uuid: number): { vault: SeedVault | undefined; isLive: boolean } {
  const isLive = useIsLive();
  return useMemo(
    () => ({ vault: isLive ? liveVaultToSeed(uuid) : vaultByUuid(uuid), isLive }),
    [isLive, uuid],
  );
}
