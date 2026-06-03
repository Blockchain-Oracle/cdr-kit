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
 * Flagship template: a data marketplace landing dark UI with a discovery grid
 * (useDiscoverVaults → VaultCard) and inline SubscribeButton per card.
 * Real Aeneid integration. No mock anywhere. The default `create-cdr-kit-app` template.
 */
export const DATA_MARKETPLACE: Template = {
  name: "data-marketplace",
  description:
    "Flagship template — dark hero + live vault discovery grid + SubscribeButton CTAs on Aeneid.",
  postInstall: ["pnpm install", "pnpm dev   # http://localhost:3000"],
  files: [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "cdr-kit-marketplace",
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
        import { SiteHeader } from "./header";
        import "@cdr-kit/react-ui/styles.css";
        import "./globals.css";

        export const metadata = {
          title: "cdr-kit · data marketplace",
          description: "Discover encrypted CDR vaults on Story Aeneid. Subscribe to decrypt.",
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

        export function SiteHeader() {
          return (
            <header className="site-header">
              <div className="brand">
                <span className="brand-dot" aria-hidden />
                <span className="brand-text">market.cdr</span>
              </div>
              <nav className="header-nav">
                <a href="/">Discover</a>
                <a href="/seller">Seller</a>
              </nav>
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
        import { Hero } from "./hero";
        import { DiscoveryGrid } from "./discovery-grid";

        export default function Page() {
          return (
            <>
              <Hero />
              <DiscoveryGrid />
            </>
          );
        }
      `),
    },
    {
      path: "app/hero.tsx",
      content: dedent(`
        export function Hero() {
          return (
            <section className="hero">
              <div className="hero-inner">
                <p className="eyebrow">Story · Confidential Data Rails</p>
                <h1 className="hero-title">
                  Encrypted vaults. <br />
                  <span className="hero-grad">Real on-chain access.</span>
                </h1>
                <p className="hero-lede">
                  Discover live CDR vaults on Aeneid testnet. Subscribe to decrypt — every read goes
                  through the threshold-decrypt protocol, every payment is on chain. No mock.
                </p>
                <div className="hero-meta">
                  <span className="hero-pill">15 active vaults</span>
                  <span className="hero-pill">9 condition types</span>
                  <span className="hero-pill">Aeneid · chain 1315</span>
                </div>
              </div>
            </section>
          );
        }
      `),
    },
    {
      path: "app/discovery-grid.tsx",
      content: dedent(`
        "use client";

        import { useDiscoverVaults } from "@cdr-kit/react";
        import { VaultCard, SubscribeButton, CdrSpinner, CdrError } from "@cdr-kit/react-ui";

        export function DiscoveryGrid() {
          const { vaults, isLoading, error } = useDiscoverVaults({ enabled: true });

          if (isLoading) return (
            <section className="discovery"><CdrSpinner /> <span className="loading-text">Scanning VaultCreated events…</span></section>
          );
          if (error) return (
            <section className="discovery">
              <CdrError title="Discovery failed" message={String(error.message ?? error)} />
            </section>
          );
          if (!vaults?.length) return (
            <section className="discovery"><p className="empty">No vaults yet on this RPC. Try the seller template to create one.</p></section>
          );

          return (
            <section className="discovery">
              <h2 className="discovery-h">Live vaults</h2>
              <div className="grid">
                {vaults.slice(0, 12).map((v) => (
                  <div key={v.uuid} className="vault-cell">
                    <VaultCard
                      uuid={v.uuid}
                      condition="subscription"
                      title={\`Vault #\${v.uuid}\`}
                      description={\`Created by \${v.creator.slice(0, 8)}…\`}
                      price="5 $IP"
                    />
                    <SubscribeButton uuid={v.uuid} priceWei={5n * 10n ** 18n} priceLabel="5 $IP" />
                  </div>
                ))}
              </div>
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
        html { background: var(--cdr-ui-bg, oklch(12% 0.012 90)); }
        body {
          margin: 0;
          font-family: var(--cdr-ui-font-sans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif);
          background: var(--cdr-ui-bg, oklch(12% 0.012 90));
          color: var(--cdr-ui-fg, oklch(94% 0.01 90));
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }
        a { color: var(--cdr-ui-primary, oklch(78% 0.16 70)); text-decoration: none; }
        a:hover { text-decoration: underline; }

        .site-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px;
          border-bottom: 1px solid var(--cdr-ui-border, oklch(20% 0.012 90));
          backdrop-filter: blur(10px);
          position: sticky; top: 0; z-index: 10;
          background: color-mix(in oklab, var(--cdr-ui-bg) 84%, transparent);
        }
        .brand { display: flex; align-items: center; gap: 10px; font-weight: 600; letter-spacing: -0.01em; font-family: ui-monospace, monospace; }
        .brand-dot {
          width: 10px; height: 10px; border-radius: 999px;
          background: linear-gradient(135deg, oklch(78% 0.16 70), oklch(72% 0.20 30));
        }
        .header-nav { display: flex; gap: 22px; font-size: 0.92rem; color: var(--cdr-ui-muted, oklch(68% 0.01 90)); }
        .header-actions { display: flex; align-items: center; gap: 14px; }

        .hero { padding: 96px 32px 64px; }
        .hero-inner { max-width: 1080px; margin: 0 auto; }
        .eyebrow {
          font-family: ui-monospace, monospace; font-size: 0.74rem;
          color: var(--cdr-ui-accent, oklch(78% 0.16 70));
          letter-spacing: 0.10em; text-transform: uppercase; margin: 0 0 14px;
        }
        .hero-title {
          font-size: clamp(2.8rem, 6.4vw, 5.2rem);
          font-weight: 800; letter-spacing: -0.035em; line-height: 1.04; margin: 0 0 22px;
        }
        .hero-grad {
          background: linear-gradient(135deg, oklch(78% 0.16 70), oklch(72% 0.20 30));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .hero-lede {
          font-size: 1.14rem; line-height: 1.65; max-width: 640px;
          color: var(--cdr-ui-muted, oklch(74% 0.01 90)); margin: 0 0 32px;
        }
        .hero-meta { display: flex; flex-wrap: wrap; gap: 10px; }
        .hero-pill {
          padding: 6px 12px; border-radius: 999px;
          font-size: 0.78rem; font-family: ui-monospace, monospace;
          border: 1px solid var(--cdr-ui-border, oklch(24% 0.012 90));
          color: var(--cdr-ui-muted, oklch(70% 0.01 90));
          background: color-mix(in oklab, var(--cdr-ui-surface, oklch(18% 0.012 90)) 80%, transparent);
        }

        .discovery { max-width: 1080px; margin: 0 auto; padding: 24px 32px 96px; }
        .discovery-h {
          font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em;
          margin: 0 0 24px;
        }
        .grid {
          display: grid; gap: 18px;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }
        .loading-text {
          font-family: ui-monospace, monospace; font-size: 0.86rem;
          color: var(--cdr-ui-muted, oklch(68% 0.01 90));
          margin-left: 10px;
        }
        .empty { font-size: 0.96rem; color: var(--cdr-ui-muted, oklch(68% 0.01 90)); }
      `),
    },
    {
      path: "README.md",
      content: dedent(`
        # cdr-kit · data marketplace

        Flagship template: live vault discovery grid + SubscribeButton CTAs on **real Aeneid testnet**.
        Zero mock. Connect a wallet to interact.

        \`\`\`bash
        pnpm install
        pnpm dev      # http://localhost:3000
        \`\`\`

        Need testnet IP? <https://aeneid.faucet.story.foundation/>

        ## What's wired up

        - \`useDiscoverVaults()\` scans \`VaultCreated\` events on the factory at
          \`0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C\` and renders each vault as a \`<VaultCard>\`
        - \`<SubscribeButton>\` runs the full subscribe → threshold-decrypt → reveal flow per card
        - \`<CdrNetworkChip>\` in the header shows the live network state
        - RainbowKit \`<ConnectButton>\` handles wallet connection

        Full docs: <https://cdrkit.xyz>
      `),
    },
    { path: ".gitignore", content: GITIGNORE },
    { path: ".env.local.example", content: ENV_LOCAL_EXAMPLE },
  ],
};
