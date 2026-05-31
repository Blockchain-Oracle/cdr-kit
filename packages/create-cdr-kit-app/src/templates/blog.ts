import { dedent } from "../util.js";
import { CDR_VERSION, type Template } from "./types.js";

export const BLOG: Template = {
  name: "blog",
  description: "Next.js 16 blog with inline <UnlockablePill> paywalls. Mock-CDR out of the box; swap one provider to go live.",
  postInstall: ["pnpm install", "pnpm dev   # http://localhost:3000"],
  files: [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "cdr-kit-blog",
          private: true,
          version: "0.0.1",
          scripts: { dev: "next dev", build: "next build", start: "next start", lint: "next lint" },
          dependencies: {
            "@cdr-kit/contracts": CDR_VERSION,
            "@cdr-kit/core": CDR_VERSION,
            "@cdr-kit/react": CDR_VERSION,
            "@cdr-kit/react-ui": CDR_VERSION,
            "@tanstack/react-query": "^5.62.0",
            next: "^16.2.6",
            react: "^19.2.0",
            "react-dom": "^19.2.0",
            viem: "^2.51.3",
            wagmi: "^2.14.0",
          },
          devDependencies: {
            "@types/node": "^20",
            "@types/react": "^19",
            "@types/react-dom": "^19",
            typescript: "^5.7.2",
          },
        },
        null,
        2,
      ),
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify(
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
      ),
    },
    { path: "next.config.ts", content: "export default { reactStrictMode: true };\n" },
    { path: "next-env.d.ts", content: '/// <reference types="next" />\n/// <reference types="next/types/global" />\n' },
    {
      path: "app/layout.tsx",
      content: dedent(`
        import type { ReactNode } from "react";
        import { Providers } from "./providers";
        import "@cdr-kit/react-ui/styles.css";
        import "./globals.css";

        export const metadata = {
          title: "cdr-kit blog — pay-to-unlock prose",
          description: "Inline paywalls powered by Story Confidential Data Rails.",
        };

        export default function RootLayout({ children }: { children: ReactNode }) {
          return (
            <html lang="en">
              <body>
                <Providers>{children}</Providers>
              </body>
            </html>
          );
        }
      `),
    },
    {
      path: "app/providers.tsx",
      content: dedent(`
        "use client";

        import { useMemo, type ReactNode } from "react";
        import { CdrProvider } from "@cdr-kit/react";
        import { createMockCdrKit } from "@cdr-kit/core";

        /** Mock CDR provider — every <UnlockablePill> on the page runs the full
         *  subscribe → threshold-read → decrypt flow against in-memory bytes.
         *  Swap mockKit for { config, apiUrl } to go live on Aeneid. */
        export function Providers({ children }: { children: ReactNode }) {
          const kit = useMemo(() => {
            const k = createMockCdrKit({ readDelayMs: 2200, threshold: 7 });
            void k.writeVaultData({ uuid: 4242, dataKey: new TextEncoder().encode(
              "Exhibit 14B — sheriff's report excerpt:\\n\\n\\"At 7:42pm the suspect was observed exiting via the boat-house door, not the main path as the witness initially stated.\\"",
            ) });
            void k.writeVaultData({ uuid: 4243, dataKey: new TextEncoder().encode(
              "The shadow on the dock wasn't her sister.\\n\\nArlo had paid Mrs. Calder twenty dollars to keep the negative — she'd developed it in her own basement that summer.",
            ) });
            return k;
          }, []);
          return <CdrProvider mockKit={kit}>{children}</CdrProvider>;
        }
      `),
    },
    {
      path: "app/page.tsx",
      content: dedent(`
        import { UnlockablePill } from "@cdr-kit/react-ui";

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
                <UnlockablePill uuid={4242} priceLabel="3 $IP" title="Exhibit 14B" subtitle="sheriff's report · attached">
                  the woman beside him on the dock
                </UnlockablePill>{" "}
                disagrees — and the timeline in the official record doesn't add up.
              </p>

              <p>
                What follows is the part the estate fought to suppress —{" "}
                <UnlockablePill uuid={4243} priceLabel="8 $IP" title="Closing chapter" subtitle="prose · unpublished">
                  the closing chapter from Arlo's lost notebook
                </UnlockablePill>{" "}
                — written in his own hand the morning after.
              </p>
            </article>
          );
        }
      `),
    },
    {
      path: "app/globals.css",
      content: dedent(`
        :root { color-scheme: light dark; }
        * { box-sizing: border-box; }
        body {
          margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          background: #fafafa; color: #1a1614;
          -webkit-font-smoothing: antialiased;
        }
        .post { max-width: 680px; margin: 0 auto; padding: 64px 24px 96px; }
        .post .eyebrow { font-family: ui-monospace, monospace; font-size: 0.72rem; color: #d9952e; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 12px; }
        .post h1 { font-size: clamp(2.1rem, 4.4vw, 3rem); font-weight: 800; letter-spacing: -0.025em; line-height: 1.1; margin: 0 0 14px; }
        .post .byline { font-family: ui-monospace, monospace; font-size: 0.78rem; color: #777; margin: 0 0 36px; }
        .post p { font-size: 1.08rem; line-height: 1.72; color: #2c2825; margin: 0 0 22px; }
        @media (prefers-color-scheme: dark) {
          body { background: #15110f; color: #fafafa; }
          .post p { color: #d4cfc9; }
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
        // Set IPFS_ADD_URL + IPFS_GATEWAY_URL for your pinning service (web3.storage, Pinata, etc.)
        // Optionally IPFS_AUTH for an Authorization header.
        const storage = createIpfsStorage({
          addUrl: process.env.IPFS_ADD_URL ?? "https://api.web3.storage/upload",
          gatewayUrl: process.env.IPFS_GATEWAY_URL ?? "https://w3s.link",
          headers: process.env.IPFS_AUTH ? { Authorization: process.env.IPFS_AUTH } : undefined,
        });
        const res = await uploadFile(client, {
          content: bytes,
          storage,
          // default = OpenCondition. For paywall, pass subscriptionCondition + readConditionData.
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

        Inline pay-to-unlock paywalls with Story CDR — the [onscroll.app](https://onscroll.app) pattern.

        \`\`\`bash
        pnpm install
        pnpm dev      # http://localhost:3000 — mock mode, no wallet
        \`\`\`

        ## How it works

        Each \`<UnlockablePill>\` is an inline span tied to a CDR vault \`uuid\`. Click it →
        a popover opens → "Unlock" runs the full \`subscribe → threshold-read → decrypt\`
        flow → the encrypted attachment renders right there. The anchor text stays
        plaintext (it's a public teaser); only the **attached payload** is encrypted.

        ## Going live on Aeneid

        1. Get a funded Aeneid testnet wallet. Add \`WALLET_PRIVATE_KEY=0x...\` to \`.env.local\`.
        2. Upload your real file & get its uuid:
           \`\`\`bash
           pnpm tsx scripts/upload.ts ./your-photo.jpg
           # → uuid: 12345
           \`\`\`
        3. Replace the \`Providers\` in \`app/providers.tsx\` — drop the \`mockKit\`, wire your
           \`wagmi\` config + the Aeneid apiUrl. (Or use \`@cdr-kit/react\`'s \`CdrConfigProvider\`
           in a wagmi tree you already maintain.)
        4. Update the \`<UnlockablePill uuid={...}>\` to use the real uuid from step 2.

        See full docs: <https://github.com/Blockchain-Oracle/cdr-kit>
      `),
    },
    { path: ".gitignore", content: "node_modules\n.next\ndist\n.env\n.env.local\n.env.*.local\n" },
    { path: ".env.local.example", content: "# WALLET_PRIVATE_KEY=0x...  # required only when uploading or going live\n" },
  ],
};

