import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const INSTALL = `$ npm install -g @cdr-kit/cli
$ cdr --help`;

const FIRST_RUN = `$ cdr wallet
# first run prints a banner with the auto-generated address + faucet URL → stderr
# subsequent runs return the wallet state as JSON / pretty-printed object`;

const COMMANDS: { name: string; description: string }[] = [
  { name: "cdr mcp", description: "Start the stdio MCP server. Same surface @cdr-kit/mcp exposes." },
  { name: "cdr wallet [--json]", description: "Show address, network, balance, wallet path (doctor command)." },
  { name: "cdr wallet new [--force]", description: "Force-generate a new wallet (refuses to overwrite without --force)." },
  { name: "cdr wallet export --yes", description: "Print the private key (DANGEROUS — requires --yes to confirm)." },
  { name: "cdr fund", description: "Print address + open the Aeneid faucet in your browser (captcha-gated)." },
  { name: "cdr config", description: "Print resolved network / RPC / API URL / wallet path." },
  { name: "cdr fees", description: "Allocate / write / read fees + operational threshold (view-only)." },
  { name: "cdr discover [--from-block N]", description: "Scan factory VaultCreated events." },
  { name: "cdr vault info <uuid>", description: "Vault info + plan + your entitlement, in one call." },
  { name: "cdr vault list --creator <addr>", description: "Every vault a creator has minted." },
  { name: "cdr vault create --read <addr> --read-config <hex> [--license-terms-id N]", description: "Create + configure + allocate — one tx." },
  { name: "cdr subscribe <uuid> [--periods N] [--max-price wei]", description: "Subscribe to + read a subscription-gated vault." },
  { name: "cdr access <uuid> [--aux-data hex]", description: "Read a vault you're already entitled to." },
  { name: "cdr access-license <uuid> --license-token-id N", description: "Read a license-gated vault by presenting a Story license token." },
  { name: "cdr subscriptions", description: "Every vault the agent is currently subscribed to." },
  { name: "cdr tools", description: "Enumerate all 34 MCP tools (introspection)." },
  { name: "cdr skill install", description: "Install the cdr-kit Claude Code plugin into ~/.claude/skills/cdr-kit/." },
  // 0.5 advanced-condition vault creators
  { name: "cdr create time-window --start <ts> --end <ts> [--block-based]", description: "Create a TimeWindowCondition vault — read allowed only during [startTs, endTs]." },
  { name: "cdr create dead-man --duration <s> --heirs <list> [--public-after]", description: "Create a DeadManSwitchCondition vault — auto-unlocks to heirs after the heartbeat lapses." },
  { name: "cdr create escrow --price <wei> --timeout <s> [--arbiter <addr>]", description: "Create a ConditionalEscrowCondition vault — buyer pays, confirms, then reads." },
  { name: "cdr create multi-sig --signers <list> --threshold <n>", description: "Create an N-of-M MultiSigCondition vault (off-chain sigs OR on-chain approve)." },
  // 0.5 condition mutators
  { name: "cdr poke <uuid>", description: "Reset the dead-man-switch heartbeat for a vault you created." },
  { name: "cdr multi-sig approve <uuid>", description: "On-chain Safe-style approval — agent must be a configured signer." },
  { name: "cdr multi-sig sign <uuid> --caller <addr> --deadline <ts>", description: "Produce an off-chain EIP-712 sig for collecting threshold-many off-band." },
  { name: "cdr multi-sig access <uuid> --deadline <ts> --sigs <list>", description: "Read a multi-sig vault by submitting collected off-chain sigs." },
  { name: "cdr multi-sig rotate <uuid> --signers <list> --threshold <n>", description: "Creator-only signer rotation; bumps epoch (invalidates BOTH paths)." },
  { name: "cdr escrow pay <uuid> --price <wei>", description: "Buyer step 1 — escrow the listing price (excess refunded same tx)." },
  { name: "cdr escrow confirm <uuid>", description: "Buyer step 2 — confirm delivery, releases funds + grants read." },
  { name: "cdr escrow claim-timeout <uuid> --buyer <addr>", description: "Seller — claim funds + grant buyer read after timeoutSecs of silence." },
  { name: "cdr escrow arbiter-refund <uuid> --buyer <addr>", description: "Arbiter — refund a buyer who paid but disputes delivery." },
  // 0.5 Story IP
  { name: "cdr ip register --spg <addr> [--metadata <uri>]", description: "Register a freshly-minted SPG NFT as a Story IP asset." },
  { name: "cdr ip attach-terms --ip <addr> --terms-id <id>", description: "Attach existing PIL license terms to an IP." },
  { name: "cdr ip mint-license --licensor <addr> --terms-id <id> [--amount N]", description: "Mint Story license tokens against an IP's licenseTermsId." },
  { name: "cdr ip register-derivative --child <addr> --parents <list> --terms-ids <list>", description: "Register a derivative IP — child inherits parents' PIL terms." },
  { name: "cdr ip wrap-ip --amount <wei>", description: "Wrap native IP into WIP (required before paying royalties)." },
  { name: "cdr ip approve-wip --spender <addr> --amount <wei>", description: "Approve a spender (typically RoyaltyModule) to pull WIP." },
];

const FLAGS = `--network aeneid|mainnet   # default aeneid; mainnet throws (not yet deployed)
--json                     # machine-readable JSON output for any command`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "CLI"],
        title: "cdr command",
        badges: <><Badge tone="primary">@cdr-kit/cli</Badge><Badge>0.5 · 25 commands</Badge></>,
        lede: <>One binary, three surfaces. <code>cdr</code> ships every cdr-kit operation as a human-friendly CLI command (25 commands across wallet / discovery / advanced conditions / Story IP); <code>cdr mcp</code> starts the stdio MCP server (same 34 tools); <code>cdr skill install</code> drops the multi-skill Claude Code plugin into <code>~/.claude/skills/cdr-kit/</code>. Auto-creates the agent&apos;s wallet on first run — no &quot;bring your own private key&quot; friction.</>,
        sections: [
          { id: "install", title: "Install", content: <CodePanel title="terminal" language="bash" code={INSTALL} /> },
          {
            id: "first-run",
            title: "First run",
            content: (
              <>
                <CodePanel title="terminal" language="bash" code={FIRST_RUN} />
                <p>
                  The wallet is generated by viem&apos;s <code>generatePrivateKey()</code>, stored at <code>~/.config/cdr-kit/wallet.json</code> (resolved cross-platform via <code>env-paths</code>), and written with <code>chmod 600</code>. Override anytime with <code>CDR_PRIVATE_KEY=0x...</code>.
                </p>
              </>
            ),
          },
          {
            id: "commands",
            title: "Commands",
            content: (
              <table className="props">
                <thead><tr><th>Command</th><th>Description</th></tr></thead>
                <tbody>
                  {COMMANDS.map((c) => (
                    <tr key={c.name}>
                      <td><code>{c.name}</code></td>
                      <td>{c.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ),
          },
          {
            id: "flags",
            title: "Global flags",
            content: <CodePanel title="terminal" language="bash" code={FLAGS} />,
          },
          {
            id: "mcp",
            title: "Use as MCP server",
            content: (
              <>
                <p>
                  <code>cdr mcp</code> is the same stdio server <code>@cdr-kit/mcp</code> ships. Either binary works for MCP host configs — most prefer <code>npx @cdr-kit/mcp</code> for zero install footprint.
                </p>
                <CodePanel title="terminal" language="bash" code={`$ claude mcp add cdr-kit npx @cdr-kit/mcp`} />
              </>
            ),
          },
        ],
        prev: { href: "/docs/agent-kit/mcp", label: "MCP server" },
        next: { href: "/docs/skill", label: "Claude Code plugin" },
      }}
    />
  );
}
