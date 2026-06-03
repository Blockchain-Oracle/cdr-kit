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
 * Single-page paywall: one Subscribe CTA gates the whole content block.
 * Real Aeneid integration. No mock. Connect a wallet to interact.
 */
export const PAYWALL: Template = {
  name: "paywall",
  description:
    "Next.js single-page paywall — one Subscribe CTA on real Aeneid CDR, dark premium card.",
  postInstall: ["pnpm install", "pnpm dev   # http://localhost:3000"],
  files: [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "cdr-kit-paywall",
          private: true,
          version: "0.0.1",
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
          },
          dependencies: SHARED_DEPS,
          devDependencies: SHARED_DEV_DEPS,
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
        import { PaywallHeader } from "./header";
        import "@cdr-kit/react-ui/styles.css";
        import "./globals.css";

        export const metadata = {
          title: "This week's signal — cdr-kit paywall",
          description: "Subscribe to decrypt the trade signal. Real Aeneid CDR.",
        };

        export default function RootLayout({ children }: { children: ReactNode }) {
          return (
            <html lang="en" data-theme="dark" suppressHydrationWarning>
              <head>
                ${THEME_INIT_SCRIPT}
              </head>
              <body>
                <Providers>
                  <PaywallHeader />
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

        export function PaywallHeader() {
          return (
            <header className="site-header">
              <div className="brand">
                <span className="brand-dot" aria-hidden />
                <span>signal.cdr</span>
              </div>
              <div className="header-actions">
                <CdrNetworkChip />
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
        import { SubscribeButton, IpPrice, ConditionBadge } from "@cdr-kit/react-ui";

        /** Real Aeneid vault — deployed via the cdr-kit factory. */
        const VAULT_ID = 4200;
        const PRICE_WEI = 5n * 10n ** 18n;

        export default function Page() {
          return (
            <section className="paywall-stage">
              <article className="paywall-card">
                <div className="card-meta">
                  <ConditionBadge tone="subscription">Subscription</ConditionBadge>
                  <IpPrice wei={PRICE_WEI} period="month" />
                </div>
                <h1 className="card-title">This week's signal</h1>
                <p className="card-lede">
                  Confidential trade signal — encrypted via Story CDR. Subscribe to decrypt and view
                  the JSON payload locally. The data never enters your bundle, server logs, or DOM
                  until your wallet's read succeeds.
                </p>
                <SubscribeButton uuid={VAULT_ID} priceWei={PRICE_WEI} priceLabel="5 $IP / month" />
                <p className="card-hint">
                  Real Aeneid testnet. Need IP?{" "}
                  <a href="https://aeneid.faucet.story.foundation/" target="_blank" rel="noreferrer">
                    Grab free testnet IP →
                  </a>
                </p>
              </article>
            </section>
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
          min-height: 100vh;
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
        .brand { display: flex; align-items: center; gap: 10px; font-weight: 600; letter-spacing: -0.01em; font-family: ui-monospace, monospace; }
        .brand-dot {
          width: 10px; height: 10px; border-radius: 999px;
          background: linear-gradient(135deg, oklch(78% 0.16 70), oklch(72% 0.20 30));
        }
        .header-actions { display: flex; align-items: center; gap: 14px; }

        .paywall-stage {
          min-height: calc(100vh - 70px);
          display: grid; place-items: center;
          padding: 48px 24px;
          background:
            radial-gradient(800px 400px at 50% 0%, color-mix(in oklab, oklch(78% 0.16 70) 12%, transparent), transparent),
            var(--cdr-ui-bg);
        }
        .paywall-card {
          width: 100%; max-width: 520px;
          background: color-mix(in oklab, var(--cdr-ui-surface, oklch(17% 0.012 90)) 92%, transparent);
          border: 1px solid var(--cdr-ui-border, oklch(24% 0.012 90));
          border-radius: 20px;
          padding: 36px 32px 32px;
          box-shadow:
            0 1px 0 color-mix(in oklab, oklch(100% 0 0) 6%, transparent) inset,
            0 24px 48px -24px color-mix(in oklab, oklch(0% 0 0) 50%, transparent);
        }
        .card-meta {
          display: flex; align-items: center; justify-content: space-between; margin: 0 0 22px;
        }
        .card-title {
          font-size: clamp(1.8rem, 3.4vw, 2.4rem);
          font-weight: 800; letter-spacing: -0.025em; line-height: 1.1; margin: 0 0 14px;
          background: linear-gradient(135deg, var(--cdr-ui-fg, #fafafa) 0%, color-mix(in oklab, var(--cdr-ui-fg) 60%, var(--cdr-ui-primary, oklch(78% 0.16 70))) 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .card-lede {
          font-size: 0.98rem; line-height: 1.65; color: var(--cdr-ui-muted, oklch(70% 0.01 90));
          margin: 0 0 24px;
        }
        .card-hint {
          margin-top: 18px; font-size: 0.84rem;
          color: var(--cdr-ui-muted, oklch(60% 0.01 90));
        }
      `),
    },
    {
      path: "README.md",
      content: dedent(`
        # cdr-kit paywall

        Classic single-block paywall: \`<SubscribeButton>\` runs subscribe → threshold-read → decrypt → reveal.

        \`\`\`bash
        pnpm install
        pnpm dev      # http://localhost:3000
        \`\`\`

        Connect any wallet that supports Story Aeneid (chain ID 1315). Grab testnet IP from
        <https://aeneid.faucet.story.foundation/>. Click Subscribe → real on-chain payment → decrypted JSON renders.

        ## Using your own vault

        1. Run \`uploadFile()\` from \`@cdr-kit/core\` server-side (or the \`cdr\` CLI) with your real data + a SubscriptionCondition.
        2. Update \`VAULT_ID\` and \`PRICE_WEI\` in \`app/page.tsx\`.

        Full docs: <https://cdr-kit.dev>
      `),
    },
    { path: ".gitignore", content: GITIGNORE },
    { path: ".env.local.example", content: ENV_LOCAL_EXAMPLE },
  ],
};
