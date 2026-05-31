import { aeneid } from "@cdr-kit/contracts";
import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/contracts", "CdrKitVault"],
        title: "CdrKitVault (factory)",
        badges: <><Badge tone="primary">factory</Badge><Badge tone="live">deployed</Badge></>,
        lede: <>The atomic factory: <code>createVault</code> mints the vault NFT, registers it as a Story IP asset, allocates the CDR slot, configures the read condition, and (optionally) attaches PIL license terms — all in one transaction. The configure step is permissioned to the factory only, closing the race a permissionless <code>setConfig</code> would open.</>,
        importLine: `address = ${aeneid.cdrKitVault}`,
        sections: [
          {
            id: "create",
            title: "createVault signature",
            content: (
              <CodePanel title="CdrKitVault.sol" code={`function createVault(
  address readConditionAddr,
  bytes calldata readConfig,
  address[] calldata childConditions,
  bytes[] calldata childConfigs,
  uint256 licenseTermsId
) external payable returns (uint32 uuid, uint256 tokenId, address ipId);`} />
            ),
          },
          {
            id: "events",
            title: "Events",
            content: <p>Emits <code>VaultCreated(tokenId, uuid, ipId, creator, licenseTermsId)</code> — read the <code>uuid</code> from the tx receipt; never predict it (global counter).</p>,
          },
          {
            id: "gas",
            title: "Gas note",
            content: <p>The factory nests a CDR precompile call (<code>allocate</code>) whose gas <code>eth_estimateGas</code> underestimates. Always set an explicit gas limit (<code>3_000_000</code> is the SDK default).</p>,
          },
        ],
        prev: { href: "/docs/contracts/creator-write-condition", label: "CreatorWriteCondition" },
        next: { href: "/docs/scaffolder", label: "npm create cdr-kit" },
      }}
    />
  );
}
