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
    heading: "Components · headless",
    links: [
      { href: "/docs/components", label: "Overview" },
      { href: "/docs/components/cdr-provider", label: "CdrProvider" },
      { href: "/docs/components/vault-gate", label: "VaultGate" },
      { href: "/docs/components/vault", label: "Vault", tag: "compound" },
      { href: "/docs/components/cdr-inspector", label: "CdrInspector" },
      { href: "/docs/components/cdr-skeleton", label: "CdrSkeleton" },
      { href: "/docs/components/empty-vaults", label: "EmptyVaults" },
    ],
  },
  {
    heading: "Components · 0.5 advanced",
    links: [
      { href: "/docs/components/heartbeat-timer", label: "HeartbeatTimer", tag: "0.5" },
      { href: "/docs/components/time-window-badge", label: "TimeWindowBadge", tag: "0.5" },
      { href: "/docs/components/multi-sig-approval-tracker", label: "MultiSigApprovalTracker", tag: "0.5" },
      { href: "/docs/components/multi-sig-signer", label: "MultiSigSigner", tag: "0.5" },
      { href: "/docs/components/escrow-delivery-confirm", label: "EscrowDeliveryConfirm", tag: "0.5" },
    ],
  },
  {
    heading: "Components · styled",
    links: [
      { href: "/docs/components/condition-badge", label: "ConditionBadge" },
      { href: "/docs/components/access-stepper", label: "AccessStepper" },
      { href: "/docs/components/subscribe-button", label: "SubscribeButton" },
      { href: "/docs/components/unlockable", label: "UnlockablePill", tag: "see demo →", tagHref: "/showcase/blog" },
      { href: "/docs/components/vault-card", label: "VaultCard" },
      { href: "/docs/components/copy-button", label: "CopyButton" },
      { href: "/docs/components/short-address", label: "ShortAddress" },
      { href: "/docs/components/explorer-link", label: "ExplorerLink" },
      { href: "/docs/components/ip-price", label: "IpPrice" },
      { href: "/docs/components/cdr-network-chip", label: "CdrNetworkChip" },
      { href: "/docs/components/cdr-spinner", label: "CdrSpinner" },
      { href: "/docs/components/cdr-progress", label: "CdrProgress" },
      { href: "/docs/components/cdr-error", label: "CdrError" },
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
      // 0.5 — advanced-condition hooks
      { href: "/docs/hooks/use-dead-man-timer", label: "useDeadManTimer", tag: "0.5" },
      { href: "/docs/hooks/use-time-window-state", label: "useTimeWindowState", tag: "0.5" },
      { href: "/docs/hooks/use-multi-sig-status", label: "useMultiSigStatus", tag: "0.5" },
      { href: "/docs/hooks/use-escrow-state", label: "useEscrowState", tag: "0.5" },
      { href: "/docs/hooks/use-storage-backend", label: "useStorageBackend", tag: "0.5" },
    ],
  },
  {
    heading: "Storage",
    links: [{ href: "/docs/storage", label: "Adapters", tag: "0.5" }],
  },
  {
    heading: "Story IP",
    links: [
      { href: "/docs/story", label: "@cdr-kit/story", tag: "0.5" },
      { href: "/docs/hooks/use-story-client", label: "useStoryClient", tag: "0.5" },
      { href: "/docs/hooks/use-register-ip", label: "useRegisterIp", tag: "0.5" },
      { href: "/docs/hooks/use-mint-license-token", label: "useMintLicenseToken", tag: "0.5" },
      { href: "/docs/hooks/use-attach-license-terms", label: "useAttachLicenseTerms", tag: "0.5" },
      { href: "/docs/hooks/use-publish", label: "usePublish", tag: "0.5" },
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
      // 0.5 — advanced conditions
      { href: "/docs/contracts/time-window-condition", label: "TimeWindowCondition", tag: "0.5" },
      { href: "/docs/contracts/dead-man-switch-condition", label: "DeadManSwitchCondition", tag: "0.5" },
      { href: "/docs/contracts/conditional-escrow-condition", label: "ConditionalEscrowCondition", tag: "0.5" },
      { href: "/docs/contracts/multi-sig-condition", label: "MultiSigCondition", tag: "0.5" },
    ],
  },
  {
    heading: "Scaffolder",
    links: [{ href: "/docs/scaffolder", label: "npm create cdr-kit" }],
  },
  {
    heading: "CLI",
    links: [{ href: "/docs/cli", label: "cdr command", tag: "new" }],
  },
  {
    heading: "Plugin / Skill",
    links: [{ href: "/docs/skill", label: "Claude Code plugin", tag: "new" }],
  },
  {
    heading: "Showcase",
    links: [{ href: "/showcase/blog", label: "Pay-to-unlock blog" }],
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
                  title={l.label}
                >
                  <span>{l.label}</span>
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
