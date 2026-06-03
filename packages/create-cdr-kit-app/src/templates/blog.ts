import { dedent } from "../util.js";
import {
  ENV_LOCAL_EXAMPLE,
  GITIGNORE,
  NEXT_CONFIG_TS,
  NEXT_ENV_DTS,
  PROVIDERS_TSX,
  SHARED_DEPS,
  SHARED_DEV_DEPS,
  THEME_INIT_SCRIPT,
  TSCONFIG_JSON,
} from "./shared.js";
import type { Template } from "./types.js";

/**
 * Premium blog template — inline <UnlockablePill> paywalls over a dark editorial layout.
 * Real Aeneid integration from the first render. No mock. Connect a wallet to interact.
 */
export const BLOG: Template = {
  name: "blog",
  description:
    "Next.js 16 editorial blog with inline <UnlockablePill> paywalls — real Aeneid integration, dark premium design.",
  postInstall: ["pnpm install", "pnpm dev   # http://localhost:3000"],
  files: [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "cdr-kit-blog",
          private: true,
          version: "0.0.1",
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
            "upload:sample": "tsx scripts/upload.ts",
          },
          dependencies: SHARED_DEPS,
          devDependencies: { ...SHARED_DEV_DEPS, tsx: "^4.19.2" },
        },
        null,
        2,
      ),
    },
    { path: "tsconfig.json", content: TSCONFIG_JSON },
    { path: "next.config.ts", content: NEXT_CONFIG_TS },
    { path: "next-env.d.ts", content: NEXT_ENV_DTS },
    {
      path: "app/layout.tsx",
      content: dedent(`
        import type { ReactNode } from "react";
        import { Providers } from "./providers";
        import { SiteHeader } from "./header";
        import "@cdr-kit/react-ui/styles.css";
        import "./globals.css";

        export const metadata = {
          title: "cdr-kit blog — pay-to-unlock prose",
          description: "Inline paywalls powered by Story Confidential Data Rails (real Aeneid testnet).",
        };

        export default function RootLayout({ children }: { children: ReactNode }) {
          return (
            <html lang="en" data-theme="dark" suppressHydrationWarning>
              <head>
                ${THEME_INIT_SCRIPT}
              </head>
              <body>
                <Providers>
                  <SiteHeader />
                  <main>{children}</main>
                </Providers>
              </body>
            </html>
          );
        }
      `),
    },
    { path: "app/providers.tsx", content: PROVIDERS_TSX },
    {
      path: "app/header.tsx",
      content: dedent(`
        "use client";

        import { ConnectButton } from "@rainbow-me/rainbowkit";
        import { CdrNetworkChip } from "@cdr-kit/react-ui";

        /** Top bar with the network chip + RainbowKit connect button. */
        export function SiteHeader() {
          return (
            <header className="site-header">
              <div className="brand">
                <span className="brand-dot" aria-hidden />
                <span>cdr-kit blog</span>
              </div>
              <div className="header-actions">
                <CdrNetworkChip mode="live" />
                <ConnectButton accountStatus="address" chainStatus="icon" />
              </div>
            </header>
          );
        }
      `),
    },
    {
      path: "app/page.tsx",
      content: dedent(`
        import { UnlockablePill } from "@cdr-kit/react-ui";

        /** Real Aeneid vault IDs (deployed via the cdr-kit factory at 0xac592f…).
         *  Swap these for your own after running scripts/upload.ts. */
        const VAULT_EXHIBIT = 4200;
        const VAULT_CHAPTER = 4201;

        export default function HomePage() {
          return (
            <article className="post">
              <header>
                <p className="eyebrow">cdr-kit blog · UnlockablePill demo</p>
                <h1>Trouble at the Lake House</h1>
                <p className="byline">Arlo Vance · 6 min read</p>
              </header>

              <p>
                Arlo Vance told the press he was alone in Tahoe to write. But{" "}
                <UnlockablePill uuid={VAULT_EXHIBIT} priceLabel="3 $IP" title="Exhibit 14B" subtitle="sheriff's report · attached">
                  the woman beside him on the dock
                </UnlockablePill>{" "}
                disagrees — and the timeline in the official record doesn't add up.
              </p>

              <p>
                What follows is the part the estate fought to suppress —{" "}
                <UnlockablePill uuid={VAULT_CHAPTER} priceLabel="8 $IP" title="Closing chapter" subtitle="prose · unpublished">
                  the closing chapter from Arlo's lost notebook
                </UnlockablePill>{" "}
                — written in his own hand the morning after.
              </p>

              <p className="hint">
                Click either inline pill above to run the real subscribe → threshold-read → decrypt flow on Aeneid.
                You'll need a wallet connected with a small amount of testnet IP (free from{" "}
                <a href="https://aeneid.faucet.story.foundation/" target="_blank" rel="noreferrer">the faucet</a>).
              </p>
            </article>
          );
        }
      `),
    },
    {
      path: "app/globals.css",
      content: dedent(`
        :root { color-scheme: dark light; }
        * { box-sizing: border-box; }
        html { background: var(--cdr-ui-bg, oklch(13% 0.012 90)); }
        body {
          margin: 0;
          font-family: var(--cdr-ui-font-sans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif);
          background: var(--cdr-ui-bg, oklch(13% 0.012 90));
          color: var(--cdr-ui-fg, oklch(94% 0.01 90));
          -webkit-font-smoothing: antialiased;
        }
        a { color: var(--cdr-ui-primary, oklch(78% 0.16 70)); text-decoration: none; }
        a:hover { text-decoration: underline; }

        .site-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 28px;
          border-bottom: 1px solid var(--cdr-ui-border, oklch(22% 0.012 90));
          backdrop-filter: blur(8px);
          position: sticky; top: 0; z-index: 10;
          background: color-mix(in oklab, var(--cdr-ui-bg) 80%, transparent);
        }
        .brand { display: flex; align-items: center; gap: 10px; font-weight: 600; letter-spacing: -0.01em; }
        .brand-dot {
          width: 10px; height: 10px; border-radius: 999px;
          background: linear-gradient(135deg, oklch(78% 0.16 70), oklch(72% 0.20 30));
        }
        .header-actions { display: flex; align-items: center; gap: 14px; }

        .post { max-width: 720px; margin: 0 auto; padding: 80px 28px 120px; }
        .post .eyebrow {
          font-family: ui-monospace, monospace; font-size: 0.72rem;
          color: var(--cdr-ui-accent, oklch(78% 0.16 70));
          letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 14px;
        }
        .post h1 {
          font-size: clamp(2.2rem, 4.4vw, 3.4rem); font-weight: 800;
          letter-spacing: -0.028em; line-height: 1.08; margin: 0 0 16px;
          background: linear-gradient(135deg, var(--cdr-ui-fg, #fafafa) 0%, color-mix(in oklab, var(--cdr-ui-fg) 60%, var(--cdr-ui-primary, oklch(78% 0.16 70))) 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .post .byline {
          font-family: ui-monospace, monospace; font-size: 0.78rem;
          color: var(--cdr-ui-muted, oklch(60% 0.01 90)); margin: 0 0 44px;
        }
        .post p { font-size: 1.12rem; line-height: 1.78; color: var(--cdr-ui-fg, #fafafa); margin: 0 0 22px; opacity: 0.92; }
        .post .hint {
          margin-top: 56px; padding: 18px 22px;
          font-size: 0.92rem; line-height: 1.6;
          border: 1px dashed var(--cdr-ui-border, oklch(28% 0.012 90));
          border-radius: 12px;
          color: var(--cdr-ui-muted, oklch(60% 0.01 90));
        }

        @media (prefers-color-scheme: light) {
          [data-theme="light"] html, [data-theme="light"] body { background: oklch(98% 0.005 90); color: oklch(20% 0.012 90); }
        }
      `),
    },
    {
      path: "scripts/upload.ts",
      content: dedent(`
        /**
         * One-time author tooling — encrypts a local file, pushes it to IPFS, allocates
         * a CDR vault on Aeneid. Print the uuid; paste it into <UnlockablePill uuid={…}>.
         *
         * Usage:
         *   pnpm tsx scripts/upload.ts ./photo.jpg
         *
         * Requires env: WALLET_PRIVATE_KEY=0x... (funded Aeneid testnet wallet).
         */
        import { readFileSync } from "node:fs";
        import { createCdrKitClient, uploadFile, createIpfsStorage } from "@cdr-kit/core";
        import { aeneid } from "@cdr-kit/contracts";
        import { createPublicClient, createWalletClient, http } from "viem";
        import { privateKeyToAccount } from "viem/accounts";

        const path = process.argv[2];
        if (!path) { console.error("usage: tsx scripts/upload.ts <file>"); process.exit(1); }

        const pk = process.env.WALLET_PRIVATE_KEY;
        if (!pk) { console.error("env WALLET_PRIVATE_KEY=0x... required"); process.exit(1); }

        const account = privateKeyToAccount(pk as \`0x\${string}\`);
        const chain = { id: 1315, name: "Aeneid", nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 }, rpcUrls: { default: { http: ["https://aeneid.storyrpc.io"] } } } as const;
        const publicClient = createPublicClient({ chain, transport: http() });
        const walletClient = createWalletClient({ account, chain, transport: http() });
        const client = createCdrKitClient({ apiUrl: "https://aeneid.storyrpc.io", publicClient, walletClient });

        const bytes = readFileSync(path);
        const storage = createIpfsStorage({
          addUrl: process.env.IPFS_ADD_URL ?? "https://api.web3.storage/upload",
          gatewayUrl: process.env.IPFS_GATEWAY_URL ?? "https://w3s.link",
          headers: process.env.IPFS_AUTH ? { Authorization: process.env.IPFS_AUTH } : undefined,
        });
        const res = await uploadFile(client, {
          content: bytes,
          storage,
          readConditionAddr: aeneid.subscriptionCondition as \`0x\${string}\`,
        });
        console.log("uuid:", res.uuid);
        console.log("ipfs cid:", res.cid);
        console.log("tx:", res.txHashes);
      `),
    },
    {
      path: "README.md",
      content: dedent(`
        # cdr-kit blog

        Inline pay-to-unlock paywalls with Story CDR — the [onscroll.app](https://onscroll.app) pattern,
        wired to **real Aeneid testnet** from the first render. No mock layer.

        \`\`\`bash
        pnpm install
        pnpm dev      # http://localhost:3000
        \`\`\`

        Connect any wallet that supports the Story Aeneid testnet (chain ID 1315). Grab free testnet IP
        from <https://aeneid.faucet.story.foundation/>. Click an inline pill → real subscribe + decrypt
        runs on chain.

        ## How it works

        Each \`<UnlockablePill>\` is an inline span tied to a CDR vault \`uuid\`. Click → popover opens →
        "Unlock" runs the full subscribe → threshold-read → decrypt flow → encrypted attachment renders.
        The anchor text stays plaintext (it's a teaser); only the attached payload is encrypted.

        ## Using your own vaults

        1. Get a funded Aeneid wallet. Set \`WALLET_PRIVATE_KEY=0x...\` in \`.env.local\`.
        2. Upload your file:
           \`\`\`bash
           pnpm upload:sample ./your-photo.jpg
           # → uuid: 12345
           \`\`\`
        3. Replace the \`VAULT_EXHIBIT\` / \`VAULT_CHAPTER\` constants in \`app/page.tsx\`.

        Full docs: <https://cdr-kit.dev>
      `),
    },
    { path: ".gitignore", content: GITIGNORE },
    { path: ".env.local.example", content: ENV_LOCAL_EXAMPLE },
  ],
};
