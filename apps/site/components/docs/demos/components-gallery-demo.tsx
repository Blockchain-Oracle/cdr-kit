"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import {
  CdrNetworkChip,
  CdrSpinner,
  CdrProgress,
  CdrError,
  IpPrice,
  ConditionBadge,
  ShortAddress,
  ExplorerLink,
} from "@cdr-kit/react-ui";

interface Tile {
  href: string;
  label: string;
  importLine?: string;
  preview: ReactNode;
}

interface Section {
  heading: string;
  hint: string;
  tiles: Tile[];
}

const SECTIONS: Section[] = [
  {
    heading: "Headless · @cdr-kit/react",
    hint: "Render-prop slots + hooks. Bring your own visuals.",
    tiles: [
      {
        href: "/docs/components/cdr-provider",
        label: "<CdrProvider>",
        importLine: "@cdr-kit/react",
        preview: <span data-tile-headless>Root provider — wagmi + react-query + WASM init</span>,
      },
      {
        href: "/docs/components/vault-gate",
        label: "<VaultGate>",
        importLine: "@cdr-kit/react",
        preview: <span data-tile-headless>Declarative gate around encrypted data</span>,
      },
      {
        href: "/docs/components/vault",
        label: "<Vault>",
        importLine: "@cdr-kit/react",
        preview: <span data-tile-headless>Compound: Vault.Locked · Loading · Unlocked</span>,
      },
      {
        href: "/docs/components/cdr-inspector",
        label: "<CdrInspector>",
        importLine: "@cdr-kit/react",
        preview: <span data-tile-headless>Dev panel — mode + WASM + API URL</span>,
      },
      {
        href: "/docs/components/cdr-skeleton",
        label: "<CdrSkeleton>",
        importLine: "@cdr-kit/react",
        preview: <span data-tile-headless>Default loading slot placeholder</span>,
      },
      {
        href: "/docs/components/empty-vaults",
        label: "<EmptyVaults>",
        importLine: "@cdr-kit/react",
        preview: <span data-tile-headless>Semantic empty-state slot</span>,
      },
    ],
  },
  {
    heading: "0.5 advanced · @cdr-kit/react",
    hint: "Headless components for the 4 advanced conditions deployed in 0.5.",
    tiles: [
      {
        href: "/docs/components/heartbeat-timer",
        label: "<HeartbeatTimer>",
        importLine: "@cdr-kit/react",
        preview: <span data-tile-headless>DeadManSwitch countdown + creator poke()</span>,
      },
      {
        href: "/docs/components/time-window-badge",
        label: "<TimeWindowBadge>",
        importLine: "@cdr-kit/react",
        preview: <span data-tile-headless>Open / opens-in / closes-in / closed</span>,
      },
      {
        href: "/docs/components/multi-sig-approval-tracker",
        label: "<MultiSigApprovalTracker>",
        importLine: "@cdr-kit/react",
        preview: <span data-tile-headless>X of Y approved + epoch tracker</span>,
      },
      {
        href: "/docs/components/multi-sig-signer",
        label: "<MultiSigSigner>",
        importLine: "@cdr-kit/react",
        preview: <span data-tile-headless>EIP-712 signer + clipboard signature</span>,
      },
      {
        href: "/docs/components/escrow-delivery-confirm",
        label: "<EscrowDeliveryConfirm>",
        importLine: "@cdr-kit/react",
        preview: <span data-tile-headless>Buyer pay → confirm delivery</span>,
      },
    ],
  },
  {
    heading: "Styled · @cdr-kit/react-ui",
    hint: "Designed, batteries-included. Live previews below.",
    tiles: [
      {
        href: "/docs/components/condition-badge",
        label: "<ConditionBadge>",
        importLine: "@cdr-kit/react-ui",
        preview: <ConditionBadge kind="subscription" />,
      },
      {
        href: "/docs/components/cdr-network-chip",
        label: "<CdrNetworkChip>",
        importLine: "@cdr-kit/react-ui",
        preview: <CdrNetworkChip mode="live" />,
      },
      {
        href: "/docs/components/cdr-spinner",
        label: "<CdrSpinner>",
        importLine: "@cdr-kit/react-ui",
        preview: <CdrSpinner />,
      },
      {
        href: "/docs/components/cdr-progress",
        label: "<CdrProgress>",
        importLine: "@cdr-kit/react-ui",
        preview: <CdrProgress collected={4} threshold={7} />,
      },
      {
        href: "/docs/components/ip-price",
        label: "<IpPrice>",
        importLine: "@cdr-kit/react-ui",
        preview: <IpPrice wei={5n * 10n ** 18n} period="month" />,
      },
      {
        href: "/docs/components/short-address",
        label: "<ShortAddress>",
        importLine: "@cdr-kit/react-ui",
        preview: <ShortAddress address="0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C" />,
      },
      {
        href: "/docs/components/explorer-link",
        label: "<ExplorerLink>",
        importLine: "@cdr-kit/react-ui",
        preview: (
          <ExplorerLink href="https://aeneid.storyscan.xyz/address/0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C">
            view on explorer
          </ExplorerLink>
        ),
      },
      {
        href: "/docs/components/cdr-error",
        label: "<CdrError>",
        importLine: "@cdr-kit/react-ui",
        preview: <CdrError title="Read timed out" />,
      },
      {
        href: "/docs/components/access-stepper",
        label: "<AccessStepper>",
        importLine: "@cdr-kit/react-ui",
        preview: <span data-tile-headless>pay → collect-partials → decrypt</span>,
      },
      {
        href: "/docs/components/subscribe-button",
        label: "<SubscribeButton>",
        importLine: "@cdr-kit/react-ui",
        preview: <span data-tile-headless>CTA + stepper + decoded payload</span>,
      },
      {
        href: "/docs/components/vault-card",
        label: "<VaultCard>",
        importLine: "@cdr-kit/react-ui",
        preview: <span data-tile-headless>Marketplace card w/ pointer spotlight</span>,
      },
      {
        href: "/docs/components/unlockable",
        label: "<UnlockablePill>",
        importLine: "@cdr-kit/react-ui",
        preview: <span data-tile-headless>Inline pay-to-unlock pill (onscroll-style)</span>,
      },
      {
        href: "/docs/components/copy-button",
        label: "<CopyButton>",
        importLine: "@cdr-kit/react-ui",
        preview: <span data-tile-headless>Tap-to-copy with checkmark feedback</span>,
      },
    ],
  },
];

/**
 * Gallery grid that restores the bespoke "at a glance" components-index look
 * lost in the TSX → MDX migration. Each tile shows a live (or descriptive)
 * preview + import line + link to the detail page.
 */
export function ComponentsGalleryDemo() {
  return (
    <div data-components-gallery>
      {SECTIONS.map((section) => (
        <section key={section.heading} data-gallery-section>
          <div data-gallery-section-head>
            <h3>{section.heading}</h3>
            <p data-gallery-hint>{section.hint}</p>
          </div>
          <div data-gallery-grid>
            {section.tiles.map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                data-gallery-tile
                aria-label={`Docs for ${tile.label}`}
              >
                <div data-tile-preview>{tile.preview}</div>
                <div data-tile-meta>
                  <code data-tile-label>{tile.label}</code>
                  {tile.importLine && <span data-tile-import>{tile.importLine}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
