import { dedent } from "../util.js";
import { CDR_VERSION, type Template } from "./types.js";

export const PAYWALL: Template = {
  name: "paywall",
  description: "Next.js single-page paywall — one Subscribe CTA gates the whole content block (classic pattern).",
  postInstall: ["pnpm install", "pnpm dev   # http://localhost:3000"],
  files: [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "cdr-kit-paywall",
          private: true,
          version: "0.0.1",
          scripts: { dev: "next dev", build: "next build", start: "next start" },
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
          devDependencies: { "@types/node": "^20", "@types/react": "^19", "@types/react-dom": "^19", typescript: "^5.7.2" },
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

        export const metadata = { title: "Paywalled report", description: "Subscribe to read." };

        export default function RootLayout({ children }: { children: ReactNode }) {
          return <html lang="en"><body>{<Providers>{children}</Providers>}</body></html>;
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

        const PAYLOAD = JSON.stringify({ signal: "BUY", pair: "ETH/USD", confidence: 0.86, ttl: "30d" }, null, 2);

        export function Providers({ children }: { children: ReactNode }) {
          const kit = useMemo(() => {
            const k = createMockCdrKit({ readDelayMs: 2200, threshold: 7 });
            void k.writeVaultData({ uuid: 4200, dataKey: new TextEncoder().encode(PAYLOAD) });
            return k;
          }, []);
          return <CdrProvider mockKit={kit}>{children}</CdrProvider>;
        }
      `),
    },
    {
      path: "app/page.tsx",
      content: dedent(`
        import { SubscribeButton } from "@cdr-kit/react-ui";

        export default function Page() {
          return (
            <main style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px", fontFamily: "system-ui" }}>
              <h1 style={{ fontSize: "2.2rem", letterSpacing: "-0.02em", marginBottom: 14 }}>This week's signal</h1>
              <p style={{ color: "#666", lineHeight: 1.6, marginBottom: 32 }}>
                A confidential trade signal. Subscribe to decrypt and view the JSON payload locally —
                the data never enters your bundle. Mock CDR · 5 IP / month.
              </p>
              <SubscribeButton uuid={4200} priceWei={5n * 10n ** 18n} priceLabel="5 $IP" />
            </main>
          );
        }
      `),
    },
    {
      path: "README.md",
      content: dedent(`
        # cdr-kit paywall

        \`\`\`bash
        pnpm install && pnpm dev
        \`\`\`

        Classic single-block paywall pattern: <SubscribeButton> runs subscribe → threshold-read → decrypt → reveal. To go live on Aeneid, swap the mock provider in \`app/providers.tsx\` for a real wagmi config + apiUrl. Use \`uploadFile()\` from \`@cdr-kit/core\` to encrypt + allocate a real vault and update the uuid.
      `),
    },
    { path: ".gitignore", content: "node_modules\n.next\ndist\n.env\n.env.local\n.env.*.local\n" },
  ],
};

