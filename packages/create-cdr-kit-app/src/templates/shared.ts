import { dedent } from "../util.js";

/**
 * Shared snippets reused by every "premium" template (blog, paywall, data-marketplace, forms).
 * Every template wires real wagmi + RainbowKit + CdrConfigProvider against Aeneid testnet.
 * No mock — when the user has no wallet connected, the components render their own connect CTAs.
 */

export const PROVIDERS_TSX = dedent(`
  "use client";

  import { useState, type ReactNode } from "react";
  import { WagmiProvider, http } from "wagmi";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { RainbowKitProvider, getDefaultConfig, midnightTheme } from "@rainbow-me/rainbowkit";
  import { CdrConfigProvider } from "@cdr-kit/react";
  import "@rainbow-me/rainbowkit/styles.css";

  const aeneid = {
    id: 1315,
    name: "Story Aeneid Testnet",
    nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
    rpcUrls: { default: { http: ["https://aeneid.storyrpc.io"] } },
    blockExplorers: { default: { name: "Aeneid Explorer", url: "https://aeneid.storyscan.xyz" } },
  } as const;

  const config = getDefaultConfig({
    appName: "cdr-kit app",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "dev",
    chains: [aeneid],
    transports: { [aeneid.id]: http() },
    ssr: true,
  });

  /** Real CDR provider — connects to Aeneid testnet. No mock anywhere.
   *  Visitors without a wallet see the components render their own
   *  Connect prompts; once they connect, every flow runs on real chain. */
  export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    return (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={midnightTheme()}>
            <CdrConfigProvider>{children}</CdrConfigProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );
  }
`);

export const THEME_INIT_SCRIPT = `<script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('cdr-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}" }} />`;

export const SHARED_DEPS = {
  "@cdr-kit/contracts": "^0.7.0",
  "@cdr-kit/core": "^0.7.0",
  "@cdr-kit/react": "^0.7.0",
  "@cdr-kit/react-ui": "^0.7.0",
  "@rainbow-me/rainbowkit": "^2.2.0",
  "@tanstack/react-query": "^5.62.0",
  next: "^16.2.6",
  react: "^19.2.0",
  "react-dom": "^19.2.0",
  viem: "^2.51.3",
  wagmi: "^2.14.0",
};

export const SHARED_DEV_DEPS = {
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  typescript: "^5.7.2",
};

export const TSCONFIG_JSON = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2022",
      lib: ["dom", "dom.iterable", "esnext"],
      module: "esnext",
      moduleResolution: "bundler",
      jsx: "preserve",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      isolatedModules: true,
      noEmit: true,
      incremental: true,
      resolveJsonModule: true,
      allowJs: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  },
  null,
  2,
);

export const NEXT_ENV_DTS = '/// <reference types="next" />\n/// <reference types="next/types/global" />\n';

export const NEXT_CONFIG_TS = "export default { reactStrictMode: true };\n";

export const ENV_LOCAL_EXAMPLE = dedent(`
  # WalletConnect (optional — only needed for WalletConnect-protocol wallets).
  # Get one free at https://cloud.walletconnect.com
  # NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

  # For server-side helpers that write to CDR (forms / data-marketplace):
  # WALLET_PRIVATE_KEY=0x...funded-aeneid-testnet-wallet...
`);

export const GITIGNORE = "node_modules\n.next\ndist\n.env\n.env.local\n.env.*.local\n";
