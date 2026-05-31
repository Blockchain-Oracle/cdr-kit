"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SideLink {
  href: string;
  label: string;
  tag?: string;
  /** If set, the tag becomes a separate clickable link to this href. */
  tagHref?: string;
}

interface SideGroup {
  heading: string;
  links: SideLink[];
}

export const SIDEBAR: SideGroup[] = [
  {
    heading: "Getting started",
    links: [
      { href: "/docs", label: "Introduction" },
      { href: "/docs/quickstart", label: "Quickstart" },
      { href: "/docs/theming", label: "Theming" },
    ],
  },
  {
    heading: "Components",
    links: [
      { href: "/docs/components", label: "Overview" },
      // headless — @cdr-kit/react
      { href: "/docs/components/cdr-provider", label: "CdrProvider" },
      { href: "/docs/components/vault-gate", label: "VaultGate" },
      { href: "/docs/components/vault", label: "Vault", tag: "compound" },
      { href: "/docs/components/cdr-inspector", label: "CdrInspector" },
      { href: "/docs/components/cdr-skeleton", label: "CdrSkeleton" },
      { href: "/docs/components/empty-vaults", label: "EmptyVaults" },
      // styled — @cdr-kit/react-ui
      { href: "/docs/components/condition-badge", label: "ConditionBadge", tag: "styled" },
      { href: "/docs/components/access-stepper", label: "AccessStepper", tag: "styled" },
      { href: "/docs/components/subscribe-button", label: "SubscribeButton", tag: "styled" },
      { href: "/docs/components/unlockable", label: "UnlockablePill", tag: "see demo →", tagHref: "/showcase/blog" },
      { href: "/docs/components/vault-card", label: "VaultCard", tag: "styled" },
      { href: "/docs/components/copy-button", label: "CopyButton", tag: "styled" },
      { href: "/docs/components/short-address", label: "ShortAddress", tag: "styled" },
      { href: "/docs/components/explorer-link", label: "ExplorerLink", tag: "styled" },
      { href: "/docs/components/ip-price", label: "IpPrice", tag: "styled" },
      { href: "/docs/components/cdr-network-chip", label: "CdrNetworkChip", tag: "styled" },
      { href: "/docs/components/cdr-spinner", label: "CdrSpinner", tag: "styled" },
      { href: "/docs/components/cdr-progress", label: "CdrProgress", tag: "styled" },
      { href: "/docs/components/cdr-error", label: "CdrError", tag: "styled" },
    ],
  },
  {
    heading: "Hooks",
    links: [
      { href: "/docs/hooks/use-access-vault", label: "useAccessVault" },
      { href: "/docs/hooks/use-subscribe-and-access", label: "useSubscribeAndAccess" },
      { href: "/docs/hooks/use-create-vault", label: "useCreateVault" },
      { href: "/docs/hooks/use-discover-vaults", label: "useDiscoverVaults" },
      { href: "/docs/hooks/use-vault", label: "useVault" },
      { href: "/docs/hooks/use-vault-events", label: "useVaultEvents" },
      { href: "/docs/hooks/use-creator-vaults", label: "useCreatorVaults" },
      { href: "/docs/hooks/use-cdr-wallet", label: "useCdrWallet" },
    ],
  },
  {
    heading: "Agent kit",
    links: [
      { href: "/docs/agent-kit", label: "CdrAgent" },
      { href: "/docs/agent-kit/vercel-ai", label: "Vercel AI SDK" },
      { href: "/docs/agent-kit/openai", label: "OpenAI / Anthropic" },
      { href: "/docs/agent-kit/langchain", label: "LangChain" },
      { href: "/docs/agent-kit/agentkit", label: "Coinbase AgentKit" },
      { href: "/docs/agent-kit/goat", label: "GOAT SDK" },
      { href: "/docs/agent-kit/mcp", label: "MCP server" },
    ],
  },
  {
    heading: "Contracts",
    links: [
      { href: "/docs/contracts", label: "Condition library" },
      { href: "/docs/contracts/subscription-condition", label: "SubscriptionCondition" },
      { href: "/docs/contracts/tier-gate-condition", label: "TierGateCondition" },
      { href: "/docs/contracts/composable-condition", label: "ComposableCondition" },
      { href: "/docs/contracts/open-condition", label: "OpenCondition" },
      { href: "/docs/contracts/creator-write-condition", label: "CreatorWriteCondition" },
      { href: "/docs/contracts/cdr-kit-vault", label: "CdrKitVault", tag: "factory" },
    ],
  },
  {
    heading: "Scaffolder",
    links: [{ href: "/docs/scaffolder", label: "npm create cdr-kit" }],
  },
  {
    heading: "Showcase",
    links: [{ href: "/showcase/blog", label: "Pay-to-unlock blog", tag: "new" }],
  },
];

export interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  return (
    <aside className={open ? "side open" : "side"}>
      {SIDEBAR.map((group) => (
        <div key={group.heading} className="side-group">
          <h5>{group.heading}</h5>
          {group.links.map((l) => {
            const active = pathname === l.href;
            return (
              <div key={l.href} className="side-row">
                <Link
                  href={l.href}
                  className={active ? "side-link active" : "side-link"}
                  onClick={onClose}
                >
                  {l.label}
                  {l.tag && !l.tagHref && <span className="tag">{l.tag}</span>}
                </Link>
                {l.tag && l.tagHref && (
                  <Link href={l.tagHref} className="side-tag-link" onClick={onClose}>
                    {l.tag}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
