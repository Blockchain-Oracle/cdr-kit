# @cdr-kit/cli

> The `cdr` binary — wallet, vaults, advanced conditions, Story IP, MCP server, plugin install.

A single CLI for everything in the cdr-kit surface: inspect your wallet, create CDR vaults (5 condition flavors), pay + access escrows, approve multi-sig reads, register Story IP, mint license tokens, boot the MCP stdio server, and install the Claude Code plugin.

Backs onto the same 34 tools exported by `@cdr-kit/tools` — every CLI command and MCP tool share one source of truth.

---

## Install

```bash
# global (recommended)
pnpm add -g @cdr-kit/cli
# or run without installing
pnpm dlx @cdr-kit/cli@latest --help
```

After install:

```bash
cdr --help
```

---

## Quick start

```bash
# 1. wallet doctor — auto-generates a wallet on first run
cdr wallet

# 2. fund it (opens Aeneid faucet in your browser — captcha-gated)
cdr fund

# 3. read current CDR fees
cdr fees

# 4. create a public vault using OpenCondition (always-allow read)
cdr vault create --read 0x78528c2dd16fc450ff417189cc0436e8d2d82389 --read-config 0x

# 5. discover recent vaults
cdr discover

# 6. inspect a specific vault
cdr vault info <uuid>
```

For agents:

```bash
# spawn the stdio MCP server — wire into Claude Desktop / Cursor / any MCP host
cdr mcp

# install the cdr-kit plugin (11 skills) into ~/.claude/plugins/cdr-kit/
cdr skill install
```

---

## Command surface (top-level)

| command                | what it does                                                                 |
| ---------------------- | ---------------------------------------------------------------------------- |
| `wallet`               | wallet status (address, balance, network)                                    |
| `fund`                 | open Aeneid faucet (captcha-gated manual)                                    |
| `config`               | resolved network / rpc / api / wallet path                                   |
| `fees`                 | CDR allocate / write / read wei + decryption threshold                       |
| `tools`                | enumerate all 34 MCP tools (introspection)                                   |
| `discover`             | scan factory VaultCreated events                                             |
| `vault info <uuid>`    | one vault's metadata + your entitlement                                      |
| `vault list`           | every vault by a creator                                                     |
| `vault create`         | mint NFT + register IP + allocate + configure read condition                 |
| `create time-window`   | TimeWindowCondition vault                                                    |
| `create dead-man`      | DeadManSwitchCondition vault                                                 |
| `create escrow`        | ConditionalEscrowCondition vault                                             |
| `create multi-sig`     | N-of-M MultiSigCondition vault                                               |
| `subscribe <uuid>`     | subscribe + read a subscription-gated vault                                  |
| `access <uuid>`        | read a vault the agent is already entitled to                                |
| `access-license <uuid>`| read a license-gated vault by presenting a Story license token id            |
| `subscriptions`        | every vault you're currently subscribed to                                   |
| `escrow pay/confirm/…` | buyer + seller + arbiter escrow flow                                         |
| `multi-sig approve/…`  | multi-sig sign / approve / access / rotate                                   |
| `poke <uuid>`          | reset a dead-man-switch heartbeat                                            |
| `ip …`                 | Story IP integration (register, attach terms, mint, derivative, publish)     |
| `mcp`                  | stdio MCP server                                                             |
| `skill install`        | install the cdr-kit plugin into `~/.claude/plugins/cdr-kit/`                 |

---

## Configuration

Env vars (override defaults):

```bash
CDR_PRIVATE_KEY=0x…       # use a specific private key (overrides on-disk wallet)
CDR_NETWORK=aeneid        # aeneid (default) | mainnet
CDR_RPC_URL=https://…     # custom RPC
CDR_API_URL=http://…      # CDR keeper API URL
LOG_LEVEL=debug           # silent | error | warn | info | debug | trace
```

On-disk wallet: `~/Library/Preferences/cdr-kit/wallet.json` (macOS) or the equivalent platform config dir.

Every command takes `--json` for machine-readable output.

---

## Peer dependencies

None — `@cdr-kit/cli` bundles everything it needs.

---

## Links

- Full docs: <https://cdrkit.xyz/docs/cli>
- npm: <https://www.npmjs.com/package/@cdr-kit/cli>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
- Story Protocol: <https://www.story.foundation>
