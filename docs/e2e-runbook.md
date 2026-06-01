# 0.5.0 end-to-end verification runbook

What "shipped" means for 0.5.0: each new surface verified against the deployed Aeneid contracts.
This file is the manual + automated test recipe. Run after every contract redeploy or major SDK
bump.

## 1. Foundry fork tests (automated, ~3s)

Validates that the pinned addresses match the deployed bytecode + factory binding.

```bash
source contracts/.env
cd contracts && forge test --match-contract AeneidForkTest --fork-url $AENEID_RPC -vv
```

Expected: **7 tests passing**.

Catches: deployment-time address drift, factory binding mismatch, unconfigured-uuid revert
regressions, MultiSig defensive-eval failure.

## 2. TS agent e2e (semi-automated, ~30–60s, costs ~0.04 IP)

Creates one vault per condition type on live Aeneid.

```bash
source contracts/.env
pnpm --filter @cdr-kit/agent exec tsx scripts/e2e-conditions.ts
# dry-run (no chain writes):
pnpm --filter @cdr-kit/agent exec tsx scripts/e2e-conditions.ts -- --dry
```

Expected stdout: 4 tx hashes (TimeWindow, DeadManSwitch, ConditionalEscrow, MultiSig) + a
`Done.` line.

Aborts on insufficient balance. Run `cdr fund` first if needed.

## 3. CLI smoke (manual, ~5 min)

Walks every CLI command surface. Requires the kit built locally OR installed from npm.

```bash
# install (or build local)
pnpm --filter @cdr-kit/cli build

# fresh-wallet smoke
HOME=$(mktemp -d) node packages/cli/dist/index.mjs wallet
HOME=$(mktemp -d) node packages/cli/dist/index.mjs --version  # → 0.4.1
HOME=$(mktemp -d) node packages/cli/dist/index.mjs config

# read flows against real testnet
CDR_PRIVATE_KEY=$PRIVATE_KEY node packages/cli/dist/index.mjs fees
CDR_PRIVATE_KEY=$PRIVATE_KEY node packages/cli/dist/index.mjs discover --from-block 0
CDR_PRIVATE_KEY=$PRIVATE_KEY node packages/cli/dist/index.mjs tools  # → 21 tools

# error mapping
node packages/cli/dist/index.mjs --network mainnet wallet  # clean throw
node packages/cli/dist/index.mjs access 999999             # friendlyError() rewrite
```

Expected: every flag honored; JSON mode parseable; insufficient-funds message mentions
`cdr fund`.

## 4. MCP stdio + tool inventory (manual, ~5 min)

Confirms the MCP wrapper exposes all 21 tools over stdio.

```bash
# init + tools/list
(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"manual-test","version":"0"}}}'; sleep 0.5;
 echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'; sleep 0.5
) | CDR_PRIVATE_KEY=$PRIVATE_KEY node packages/mcp/dist/index.mjs 2>/dev/null | jq '.result.tools | length'
# → 21

# call a real tool (cdr_get_fees, no wallet needed for state)
(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"manual-test","version":"0"}}}'; sleep 0.5;
 echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"cdr_get_fees","arguments":{}}}'; sleep 1
) | CDR_PRIVATE_KEY=$PRIVATE_KEY node packages/mcp/dist/index.mjs 2>/dev/null | jq '.result.content[0].text | fromjson'
# → { allocateWei, writeWei, readWei, threshold }
```

Then install into Claude Desktop / Cursor / Windsurf:

```bash
claude mcp add cdr-kit -- npx -y @cdr-kit/mcp@0.5.0-rc1
# Restart the MCP host. Then ask Claude:
#   "list every cdr-kit MCP tool you have"   → 21 tools listed
#   "fetch the CDR operational fees"         → cdr_get_fees, returns 4 fields
#   "discover Story CDR vaults from block 0" → cdr_discover_vaults, returns ≥4 vaults
```

## 5. React component browser-verify (manual, ~10 min)

Each new component must render correctly against live testnet state.

```bash
pnpm --filter @cdr-kit/site dev
# Open http://localhost:3000/docs/components in Chrome
```

For each component, screenshot + zero-console-errors check:

- `<TimeWindowBadge uuid={…} />` against a vault from §2.1 → renders "closes in 59m 30s" etc.
- `<HeartbeatTimer uuid={…} />` against a vault from §2.2 → countdown ticks; `extend now` calls
  `poke` and resets to 5m.
- `<MultiSigApprovalTracker uuid={…} signedBy={[]} />` against §2.4 → "0 of 1 approved · epoch 0".
- `<EscrowDeliveryConfirm uuid={…} buyer={...} />` against §2.3 → renders `pay` button; clicking
  it triggers the `pay()` write.

Use chrome-devtools MCP screenshots to compare side-by-side with the design baseline.

## 6. Adapter package roundtrip (automated, ~30s)

```bash
pnpm -r run test
```

Expected: 11 packages, all green. Specific assertions:
- `@cdr-kit/tools` lists 21 tool names (alphabetical).
- All 5 adapter packages (goat / langchain / openai / vercel-ai / agentkit) return 21 tools.
- `@cdr-kit/core` storage adapters (Pinata / Supabase / ReadOnlyGateway) round-trip via mocked
  fetch.

## What "pass" means

A 0.5.0 release is shippable iff:

1. Fork tests: 7/7 pass.
2. Workspace tests: 100% pass across all 11 packages.
3. CLI smoke: every command produces well-formed JSON; error messages are actionable.
4. MCP stdio: tools/list returns 21; a real tool/call (e.g. `cdr_get_fees`) returns valid data.
5. React: 0 console errors; component visuals match the baseline screenshots.
6. Live agent e2e: 4 condition vaults created successfully (script in §2).
