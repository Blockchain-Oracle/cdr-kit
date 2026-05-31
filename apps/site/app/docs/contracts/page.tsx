import Link from "next/link";
import { aeneid } from "@cdr-kit/contracts";
import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function ContractsPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Contracts"],
        title: "Condition standard library",
        badges: <Badge tone="primary">@cdr-kit/contracts</Badge>,
        lede: <>A tested Solidity standard library + a factory (<code>CdrKitVault</code>) that mints, registers IP, allocates the CDR slot, and configures the read condition in one transaction. All deployed to Aeneid testnet (chain id <code>{aeneid.chainId}</code>).</>,
        importLine: 'import { aeneid } from "@cdr-kit/contracts"',
        sections: [
          {
            id: "library",
            title: "Library",
            content: (
              <ul>
                <li><Link href="/docs/contracts/subscription-condition"><code>SubscriptionCondition</code></Link></li>
                <li><Link href="/docs/contracts/tier-gate-condition"><code>TierGateCondition</code></Link></li>
                <li><Link href="/docs/contracts/composable-condition"><code>ComposableCondition</code></Link></li>
                <li><Link href="/docs/contracts/open-condition"><code>OpenCondition</code></Link></li>
                <li><Link href="/docs/contracts/creator-write-condition"><code>CreatorWriteCondition</code></Link></li>
                <li><Link href="/docs/contracts/cdr-kit-vault"><code>CdrKitVault</code></Link> — the factory</li>
              </ul>
            ),
          },
          {
            id: "interface",
            title: "Condition interface",
            content: (
              <>
                <p>Conditions are pure <code>view</code> functions the validator network calls at read/write time. The 4-param signature:</p>
                <CodePanel title="ICdrCondition.sol" code={`function checkReadCondition(
  uint32 uuid,
  bytes accessAuxData,
  bytes conditionData,
  address caller
) external view returns (bool);`} />
              </>
            ),
          },
          {
            id: "addresses",
            title: "Deployed (Aeneid)",
            content: (
              <ul style={{ fontFamily: "var(--mono)", fontSize: "0.82rem" }}>
                <li>CdrKitVault: <code>{aeneid.cdrKitVault}</code></li>
                <li>SubscriptionCondition: <code>{aeneid.subscriptionCondition}</code></li>
                <li>TierGateCondition: <code>{aeneid.tierGateCondition}</code></li>
                <li>ComposableCondition: <code>{aeneid.composableCondition}</code></li>
                <li>OpenCondition: <code>{aeneid.openCondition}</code></li>
                <li>CreatorWriteCondition: <code>{aeneid.creatorWriteCondition}</code></li>
              </ul>
            ),
          },
        ],
        prev: { href: "/docs/agent-kit/mcp", label: "MCP server" },
        next: { href: "/docs/contracts/subscription-condition", label: "SubscriptionCondition" },
      }}
    />
  );
}
