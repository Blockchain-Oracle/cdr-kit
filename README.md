# cdr-kit

**The developer toolkit for Story Protocol's Confidential Data Rails (CDR)** — the wagmi/Stripe layer for CDR.

A standard library of 9 deployed CDR condition contracts + a typed TS SDK + a React layer + an autonomous agent SDK + a CLI + an MCP server + a Claude Code plugin + a Next.js dashboard, so anyone can ship private, paid, license-gated data on Story without hand-rolling the protocol. CDR's encryption is commodity (Lit/TACo do it too) — cdr-kit's edge is the **Story IP coupling** (license-tier gating + royalty rails) made usable.

> **Status: 0.6.0 live on npm + Aeneid.** 15 packages published to [npmjs.com/org/cdr-kit](https://www.npmjs.com/org/cdr-kit). 9 conditions deployed on Story Aeneid (5 base + 4 advanced shipped in 0.5). 110 Foundry tests + workspace lint/typecheck/build/test all green. Dashboard live at [cdrkit.xyz](https://cdrkit.xyz) (built from `apps/site/`). The full encrypt→write→read→decrypt round-trip, the dual-path MultiSig flow, the Story IP creator path (`agent.publish()`), and an autonomous LLM-driven agent paying + reading via MCP tools all run end-to-end on real chain.

## Use the skills from any agent (Claude Code · Cursor · Copilot · Cline · …)

```
npx skills add Blockchain-Oracle/cdr-kit
```

Installs the cdr-kit Agent Skills via [skills.sh](https://skills.sh).

## Install (any of these — pick the surface you want)

```bash
# CLI (one binary, 25+ commands, includes the MCP server as `cdr mcp`)
npm i -g @cdr-kit/cli

# MCP for Claude Code / Cursor / Windsurf
claude mcp add cdr-kit -- npx -y @cdr-kit/mcp

# Claude Code skills (auto-installed by the CLI; covers vault design + 0.5 conditions + Story IP)
cdr skill install

# Scaffold a fresh project (Next.js / blog / paywall / MCP-server / agent-* templates)
npm create cdr-kit-app@latest

# Or in your app
pnpm add @cdr-kit/react @cdr-kit/core wagmi viem
pnpm add @cdr-kit/agent      # autonomous-agent client
pnpm add @cdr-kit/story @story-protocol/core-sdk   # Story IP creator surface
```

## Packages (15 on npm @ 0.5.x / 0.6.0)

| Package | What |
|---|---|
| `contracts/` (Foundry) | 9 condition contracts: `Subscription`, `TierGate`, `Composable`, `CreatorWrite`, `Open`, `TimeWindow`, `DeadManSwitch`, `ConditionalEscrow`, `MultiSig` (dual-path) + `CdrKitVault` factory |
| `@cdr-kit/contracts` | wagmi-cli typed ABIs + verified Aeneid addresses (single source of truth) |
| `@cdr-kit/core` | `createCdrKitClient`, encoders, 2-step flows, 8 storage adapters, `decodeContractRevert` + `writeWithDecode`, WASM init |
| `@cdr-kit/agent` | `CdrAgent` — discover → subscribe → access + 12 advanced helpers (approve, sign, rotate, pay/confirm/refund, poke, publish) |
| `@cdr-kit/story` | Story IP creator surface: `createSpgCollection`, `registerIpAsset`, `mintLicenseTokens`, `attachLicenseTerms`, `registerDerivative`, `wrapIp`, `approveWip`, `PILFlavor` |
| `@cdr-kit/react` | `<CdrProvider>`, `<VaultGate>`, `<Vault>` compound, 5 condition components (`HeartbeatTimer`, `TimeWindowBadge`, `MultiSigApprovalTracker`, `MultiSigSigner`, `EscrowDeliveryConfirm`), 7+ hooks, Story IP hooks |
| `@cdr-kit/react-ui` | Styled drop-ins built on the headless layer |
| `@cdr-kit/tools` | 34 framework-agnostic agent tools (single source mapped to MCP + every framework adapter) |
| `@cdr-kit/mcp` | Stdio MCP server (Claude Desktop / Cursor / Windsurf / OpenClaw) — 34 tools |
| `@cdr-kit/cli` | The `cdr` binary — 25+ commands (vault, multi-sig, escrow, ip, mcp, skill, ...) |
| `@cdr-kit/vercel-ai` `@cdr-kit/openai` `@cdr-kit/langchain` `@cdr-kit/agentkit` `@cdr-kit/goat` | Framework adapters wrapping `@cdr-kit/tools` |
| `create-cdr-kit-app` | Scaffolder — 9 templates (starter / blog / paywall / mcp-server / agent-vercel-ai / agent-openai / agent-langchain / agent-agentkit / agent-goat) |

## Deployed (Story Aeneid testnet, chain 1315)

```
CdrKitVault                  0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C   factory
SubscriptionCondition        0xB75Cc6571ac7E0ee30A519192740fc471e187458
TierGateCondition            0xdA704Faf61b2FFB37205d7Eb8C1D26BD3090455f
ComposableCondition          0x74F2f94e7867b07ECDFbcc667050CBec1dE2800B
CreatorWriteCondition        0x85CEB332445ca1d3D1975d6929cA6BED25195b2F
OpenCondition                0x36fB2e2d10efd1E905b7779A684F34B9c775b62B
TimeWindowCondition          0x67911435F262e7e4EC4F7FEB4e868a67b9dd90b1   0.5
DeadManSwitchCondition       0x37226f97e184843aB0b8d4f08A55969801B97766   0.5
ConditionalEscrowCondition   0x7fcDe02DB7c14fD3587aB2fED064a1D8355b7584   0.5
MultiSigCondition            0x3A0Cf72f167A2c1f5a7A5025eb36219f28C20FCd   0.5 · dual-path
defaultLicenseTermsId        2536
```

Authoritative source: [`packages/contracts/src/addresses.ts`](packages/contracts/src/addresses.ts).

## Quickstart (React)

```tsx
import { CdrProvider, VaultGate } from "@cdr-kit/react";

<CdrProvider config={wagmiConfig} apiUrl="http://172.192.41.96:1317">
  <VaultGate uuid={vaultId} auto loading={<Spinner/>} fallback={<SubscribeButton/>}>
    {(data) => <pre>{new TextDecoder().decode(data)}</pre>}
  </VaultGate>
</CdrProvider>
```

## Quickstart (CLI / agent / Story IP)

```bash
# CLI: discover vaults + read fees + create an advanced-condition vault
cdr discover
cdr fees
cdr create dead-man --duration 3600 --heirs 0xHeir,0xHeir2

# Agent-as-publisher one-shot (Story IP + license-gated CDR vault in one tx-bundle)
cdr ip create-collection --name "my-data" --symbol "MYDATA"        # returns SPG addr
# (use the SPG in a real publish via the @cdr-kit/agent SDK's agent.publish({data, ...}))

# MultiSig dual-path: collect off-chain EIP-712 sigs OR Safe-style on-chain approve
cdr multi-sig sign 4908 --caller 0xBuyer --deadline $(($(date +%s)+3600))
cdr multi-sig approve 4908 --expected-epoch 2   # auto-decodes EpochChanged on mismatch
```

## Live demos (real Aeneid)

```bash
source contracts/.env                                          # PRIVATE_KEY (testnet), funded via faucet
pnpm --filter @cdr-kit/core  run e2e                           # encrypt→write→read→decrypt round-trip
pnpm --filter @cdr-kit/agent run demo                          # seller vault → agent pays + reads
pnpm --filter @cdr-kit/agent exec tsx scripts/e2e_multisig_new.ts        # MultiSig on-chain approve + EpochChanged
pnpm --filter @cdr-kit/agent exec tsx scripts/e2e_multisig_offchain.ts   # MultiSig off-chain EIP-712 sig round-trip
```

## Dev

```bash
pnpm install
pnpm build | pnpm test | pnpm lint | pnpm typecheck            # turbo across 15 packages
cd contracts && forge test                                     # 110 Foundry tests
forge script script/Deploy.s.sol:Deploy --rpc-url aeneid \
  --broadcast --legacy --with-gas-price 60000000000 --slow     # see CLAUDE.md gotchas
```

## Repo layout

```
story-cdr/
├── contracts/      # Foundry: 9 conditions + CdrKitVault + Deploy*.s.sol scripts
├── packages/       # 15 npm packages — see table above
│   └── plugin/cdr-kit/   # Claude Code plugin: 11 skills
├── apps/site/      # Next.js dashboard / docs site (cdrkit.xyz)
├── examples/       # vercel-ai-chatbot — runnable LLM-driven agent demo
├── docs/           # SPECS — PRD, architecture, ux-spec, epics, BDD stories
├── context/        # KNOWLEDGE BASE — research, decisions (D1–D24), vendored source
└── CLAUDE.md       # build conventions + gotchas for coding agents
```

`context/00-START-HERE.md` is the entrypoint for understanding *why/how CDR works* (verified on-chain). `docs/` is *what we're building*. Dashboard work? See `docs/ux-spec.md` + `docs/stories/story-e7-dashboard.md`.

## Gotchas (full detail in `context/research/cdr-protocol-truth.md` + `CLAUDE.md`)

- **CDR has no confidential compute** — the buyer holds plaintext after decrypt. The moat is no-billing-infra + royalty rails + on-chain revocation, not secrecy-after-sale.
- **Condition interface is 4-param uuid-first** (`checkReadCondition(uint32,bytes,bytes,address)`) — the protocol docs' 3-param shape is stale. Verified on-chain.
- **Raw CDR precompile txs need an explicit gas limit** (eth_estimateGas OOGs them); the SDK path is fine, and `core.createVault` sets one.
- **`uuid` is a global counter** — read it from the `VaultCreated`/`VaultAllocated` event, never predict it.
- **Read latency: tens of seconds typical, 7-min server-side ceiling.** Default `timeoutMs: 120_000` (corrected from earlier 600_000 in 0.5).
- **forge auto-gas estimation is 2.8B× too low on Aeneid** — always pass `--legacy --with-gas-price 60000000000` to `forge script ... --broadcast`.
- **MultiSig dual-path:** off-chain EIP-712 sigs OR on-chain `approve(uuid, expectedEpoch)`. `rotateSigners` bumps epoch → invalidates BOTH paths. CLI/MCP get `EpochChanged(expected, current)` decoded automatically in 0.6.
- **MCP server caches addresses at process start** — after a contract redeploy + `pnpm build`, restart Claude (and re-run `claude mcp add ... @latest`) before testing the MCP path.
- Testnet only — Story mainnet hasn't deployed CDR yet. `cdr --network mainnet` throws cleanly.
