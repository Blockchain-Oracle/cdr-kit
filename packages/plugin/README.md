# cdr-kit Claude Code plugin

> 11 skills + 2 reference docs that teach Claude *how* to design, wire, and debug around Story Confidential Data Rails.

## Use the skills from any agent (Claude Code · Cursor · Copilot · Cline · …)

```
npx skills add Blockchain-Oracle/cdr-kit
```

Installs the cdr-kit Agent Skills via [skills.sh](https://skills.sh).

This is the plugin source. It's bundled inside `@cdr-kit/cli` and installed by:

```bash
cdr skill install
# → writes to ~/.claude/plugins/cdr-kit/
```

After install, restart Claude Code — the 11 skills + reference cheatsheets become available alongside any other plugins you have.

---

## What's in the plugin

```
packages/plugin/cdr-kit/
├── .claude-plugin/
│   └── plugin.json                  # plugin manifest (11 skills)
├── skills/
│   ├── design-condition/            SKILL.md
│   ├── design-storage-adapter/      SKILL.md
│   ├── design-multisig-condition/   SKILL.md
│   ├── design-deadman-switch/       SKILL.md
│   ├── design-time-window/          SKILL.md
│   ├── design-escrow/               SKILL.md
│   ├── design-publish-with-story/   SKILL.md
│   ├── wire-allocate-pay-read/      SKILL.md
│   ├── debug-cdr-precompile/        SKILL.md
│   ├── audit-vault-config/          SKILL.md
│   └── explain-cdr-error/           SKILL.md
├── references/
│   ├── conditions-cheatsheet.md     # full ABI + encoding per condition
│   └── error-catalog.md             # every CdrErrorCode + SDK mapping
└── README.md
```

### When each skill fires

| skill                          | trigger                                                                  |
| ------------------------------ | ------------------------------------------------------------------------ |
| `design-condition`             | "I want a vault gated by …" — pick or build a condition contract         |
| `design-storage-adapter`       | "Where should the IPFS payload live?" — picks adapter, wires SDK lazy-load |
| `design-multisig-condition`    | N-of-M designs, off-chain vs on-chain path, epoch rotation               |
| `design-deadman-switch`        | heartbeat windows, heir lists, public-after-unlock semantics             |
| `design-time-window`           | absolute vs block-based windows, open-ended encoding                     |
| `design-escrow`                | buyer/seller/arbiter flow, timeoutSecs, dispute paths                    |
| `design-publish-with-story`    | one-shot register IP + attach PIL + create vault + write data            |
| `wire-allocate-pay-read`       | two-step pattern → mutating tx → view read                               |
| `debug-cdr-precompile`         | OOG, gas limits, ReentrancySentryOOG, mempool stalls                     |
| `audit-vault-config`           | inspect a deployed vault, decode condition data, spot misconfigs         |
| `explain-cdr-error`            | map a viem revert message → CdrErrorCode → human action                  |

### MCP vs Skill vs CLI

Per the Anthropic boundary: **MCP** = access external systems. **Skill** = how-to procedural knowledge. **CLI** = same surface for humans.

cdr-kit ships all three from one core:
- the 34 CDR operations are MCP tools in `@cdr-kit/mcp`
- this plugin's 11 SKILL.mds teach Claude the procedural knowledge
- `cdr` exposes the same surface in your terminal

---

## Links

- Full docs: <https://cdrkit.xyz/docs/skill>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
- Anthropic boundary guide: <https://www.morphllm.com/claude-code-skills-mcp-plugins>
