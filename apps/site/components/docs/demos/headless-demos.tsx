"use client";

import { CdrInspector, CdrSkeleton, EmptyVaults } from "@cdr-kit/react";
import { DocsMockProvider } from "../providers";

export function CdrInspectorDemo() {
  return (
    <DocsMockProvider>
      <CdrInspector />
    </DocsMockProvider>
  );
}

export function CdrSkeletonDemo() {
  return (
    <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 18 }}>
      <CdrSkeleton />
      <CdrSkeleton lines={5} />
    </div>
  );
}

export function EmptyVaultsDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <EmptyVaults />
      <EmptyVaults>No vaults match your filter.</EmptyVaults>
    </div>
  );
}
