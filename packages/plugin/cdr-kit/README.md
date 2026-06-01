# cdr-kit plugin

The Claude Code plugin for Story Confidential Data Rails. Bundles 5 skills that teach an agent how to **design conditions**, **wire allocate/pay/read**, **debug the precompile**, **audit vault configs**, and **explain CDR errors** — pairing with the `cdr-kit` MCP server (`npx @cdr-kit/mcp`) and the `cdr` CLI (`npm i -g @cdr-kit/cli`).

## Install

Three paths:

```bash
# 1. via the cdr CLI (recommended)
npm i -g @cdr-kit/cli
cdr skill install

# 2. via Claude Code's plugin marketplace
/plugin marketplace add Blockchain-Oracle/cdr-kit
/plugin install cdr-kit@cdr-kit

# 3. manual
cp -r packages/plugin/cdr-kit ~/.claude/skills/cdr-kit
```

## Layout

```
cdr-kit/
├── .claude-plugin/
│   └── plugin.json             # plugin manifest
├── skills/
│   ├── design-condition/       # picking the right CDR condition
│   ├── wire-allocate-pay-read/ # the canonical 4-step flow
│   ├── debug-cdr-precompile/   # 7 failure modes + fixes
│   ├── audit-vault-config/     # view-only audit playbook
│   └── explain-cdr-error/      # error code → root cause + fix lookup
├── references/
│   ├── conditions-cheatsheet.md  # full ABI + encoding per condition
│   └── error-catalog.md          # every CdrErrorCode + SDK mapping
└── README.md
```

Each `SKILL.md` is ≤500 lines (per Anthropic's hard cap), with depth pushed to `references/`.

## What the skills teach

| Skill | When it fires |
|---|---|
| `design-condition` | "Which CDR condition should I use for X?" |
| `wire-allocate-pay-read` | "How do I create + write + read a vault end-to-end?" |
| `debug-cdr-precompile` | "OOG / `ReentrancySentryOOG` / `AlreadyConfigured` / partial-collection timeout" |
| `audit-vault-config` | "Should I subscribe to this?" / "Did my deployment configure right?" |
| `explain-cdr-error` | Any raw error message, SDK class name, or stack trace |

## Companion tools

- **`@cdr-kit/cli`** — `cdr wallet / vault / subscribe / access / fees / mcp / skill install`
- **`@cdr-kit/mcp`** — stdio MCP server with 13 tools; `npx @cdr-kit/mcp` plugs into Claude Desktop / Cursor / any MCP host
- **`@cdr-kit/{core, react, react-ui, agent, tools, contracts}`** — the runtime kit

See <https://github.com/Blockchain-Oracle/cdr-kit> for the full docs.
