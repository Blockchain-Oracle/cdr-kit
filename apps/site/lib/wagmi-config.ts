import { http } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const aeneid = {
  id: 1315,
  name: "Story Aeneid Testnet",
  nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
  rpcUrls: { default: { http: ["https://aeneid.storyrpc.io"] } },
  blockExplorers: { default: { name: "Aeneid Explorer", url: "https://aeneid.storyscan.xyz" } },
} as const;

/**
 * Single wagmi config for the docs site — Aeneid testnet only.
 * Every Demo block + the catch-all page uses this through `<SiteProviders>`.
 * Visitors connect their own wallet; we never hold a private key here.
 */
export const wagmiConfig = getDefaultConfig({
  appName: "cdr-kit docs",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "cdrkit-docs-dev",
  chains: [aeneid],
  transports: { [aeneid.id]: http() },
  ssr: true,
});

export const AENEID_CHAIN_ID = 1315;
