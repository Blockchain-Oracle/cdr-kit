import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

const INSTALL_PATHS = `# 1. via the cdr CLI (recommended)
$ npm install -g @cdr-kit/cli
$ cdr skill install

# 2. via Claude Code's plugin marketplace
$ claude
/plugin marketplace add Blockchain-Oracle/cdr-kit
/plugin install cdr-kit@cdr-kit

# 3. manual
$ git clone https://github.com/Blockchain-Oracle/cdr-kit
$ cp -r cdr-kit/packages/plugin/cdr-kit ~/.claude/skills/cdr-kit`;

const SKILLS: { name: string; trigger: string; what: string }[] = [
  { name: "design-condition", trigger: "Which CDR condition should I use for X?", what: "Decision tree for picking among open / subscription / tier-gate / composable / license-read. Encoding cheatsheet per condition." },
  { name: "wire-allocate-pay-read", trigger: "How do I create a vault and read it?", what: "The canonical 4-step flow (creator + consumer sides). Gotchas: OOG, uuid-from-receipt, value-must-match-price." },
  { name: "debug-cdr-precompile", trigger: "OOG / ReentrancySentryOOG / AlreadyConfigured / partial-collection timeout", what: "7 failure modes with root cause + fix. Backed by the gotchas in context/research/cdr-protocol-truth.md." },
  { name: "audit-vault-config", trigger: "Should I subscribe to this? / Did my deploy configure right?", what: "4-call view-only audit. Red-flag checklist (payee mismatch, never-expiring period, missing licenseTermsId)." },
  { name: "explain-cdr-error", trigger: "(Any raw error message)", what: "Lookup table from error code → root cause + fix. Maps every @piplabs/cdr-sdk error class." },
  // 0.5 — advanced features
  { name: "design-storage-adapter", trigger: "Which storage backend for my CDR file vault? Pinata / Supabase / R2 / Storacha?", what: "Decision tree for picking among the 6 official adapters + 3 ecosystem packages. Wiring examples, common failure modes (CORS, RLS, CID drift)." },
  { name: "design-multisig-condition", trigger: "Multi-sig CDR vault / N-of-M approval / off-chain signing", what: "N-of-M EIP-712 setup, signer rotation, sig-collection UX, caller binding, ECDSA-malleability dedupe, EIP-1271 gap." },
  { name: "design-deadman-switch", trigger: "Dead-man switch / wallet recovery / leak-on-disappearance / heartbeat", what: "Trapdoor semantics, poke() cadence, block-vs-timestamp tradeoff, heir variants, operational risk (forgotten heartbeat)." },
];

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit", "Plugin / Skill"],
        title: "Claude Code plugin",
        badges: <><Badge tone="primary">cdr-kit plugin</Badge><Badge>8 skills · v0.5</Badge></>,
        lede: <>A multi-skill Claude Code plugin (Trail-of-Bits density) that teaches any agent the cdr-kit workflows. Each <code>SKILL.md</code> is under 500 lines (per Anthropic&apos;s hard cap); reference docs (ABIs, error catalog) live in a <code>references/</code> subdir loaded on demand. Pairs with the <code>cdr</code> CLI and the <code>@cdr-kit/mcp</code> server — three coordinated surfaces, one bundle.</>,
        sections: [
          { id: "install", title: "Install (three paths)", content: <CodePanel title="terminal" language="bash" code={INSTALL_PATHS} /> },
          {
            id: "skills",
            title: "Skills (8)",
            content: (
              <table className="props">
                <thead><tr><th>Skill</th><th>When it fires</th><th>What it teaches</th></tr></thead>
                <tbody>
                  {SKILLS.map((s) => (
                    <tr key={s.name}>
                      <td><code>{s.name}</code></td>
                      <td>{s.trigger}</td>
                      <td>{s.what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ),
          },
          {
            id: "layout",
            title: "Plugin layout",
            content: (
              <CodePanel title="tree" language="bash" code={`packages/plugin/cdr-kit/
├── .claude-plugin/
│   └── plugin.json             # plugin manifest (8 skills registered)
├── skills/
│   ├── design-condition/           SKILL.md
│   ├── wire-allocate-pay-read/     SKILL.md
│   ├── debug-cdr-precompile/       SKILL.md
│   ├── audit-vault-config/         SKILL.md
│   ├── explain-cdr-error/          SKILL.md
│   ├── design-storage-adapter/     SKILL.md   # 0.5
│   ├── design-multisig-condition/  SKILL.md   # 0.5
│   └── design-deadman-switch/      SKILL.md   # 0.5
├── references/
│   ├── conditions-cheatsheet.md  # full ABI + encoding per condition
│   └── error-catalog.md          # every CdrErrorCode + SDK mapping
└── README.md`} />
            ),
          },
          {
            id: "boundary",
            title: "Skill vs MCP vs CLI",
            content: (
              <>
                <p>
                  Per the Anthropic-blessed boundary (<a href="https://www.morphllm.com/claude-code-skills-mcp-plugins" target="_blank" rel="noreferrer">guide</a>): <b>MCP</b> = let Claude <i>access</i> external systems; <b>Skill</b> = let Claude <i>know how</i> to do something; <b>CLI</b> = the same operations exposed for a human in the terminal.
                </p>
                <p>
                  cdr-kit ships all three from one shared core: the 21 CDR operations are MCP tools in <code>@cdr-kit/mcp</code>; this plugin&apos;s 8 SKILL.mds teach Claude the procedural knowledge for designing, wiring, and debugging around those tools; <code>cdr</code> exposes the same surface for terminal use.
                </p>
              </>
            ),
          },
        ],
        prev: { href: "/docs/cli", label: "CLI: cdr" },
        next: { href: "/docs/contracts", label: "Contracts" },
      }}
    />
  );
}
