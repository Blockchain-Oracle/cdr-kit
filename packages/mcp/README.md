# @cdr-kit/mcp

> Model Context Protocol (stdio) server for Story CDR. One binary, 34 tools, plugs into Claude Desktop / Cursor / any MCP host.

The MCP server exposes the same 34 tools as `@cdr-kit/tools`. The agent's wallet auto-generates on first run (auto-funded via the faucet step below) — no per-conversation key juggling.

---

## Install

```bash
pnpm add -g @cdr-kit/mcp
# provides the `cdr-kit-mcp` binary
```

---

## Wire to Claude Desktop / Cursor

```jsonc
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "cdr-kit": {
      "command": "cdr-kit-mcp",
      "env": {
        "CDR_PRIVATE_KEY": "0x…",                  // optional — auto-generates if omitted
        "CDR_RPC_URL": "https://aeneid.storyrpc.io"
      }
    }
  }
}
```

Restart your MCP host. Verify:

```bash
# in your MCP host: ask "list cdr tools" → should return all 34
```

---

## Wire to OpenClaw / generic MCP

```bash
openclaw mcp set cdr-kit cdr-kit-mcp
```

---

## What you get

- 34 tools, schema-typed (JSON-Schema), same as `@cdr-kit/tools`
- stdio transport: stdout is the protocol channel, all logs go to stderr (never breaks the wire)
- Auto-wallet: first boot generates `~/Library/Preferences/cdr-kit/wallet.json`. Fund it via `cdr fund`.
- 0.5+ advanced conditions + Story IP author surface included

---

## Boot directly (no host)

```bash
cdr mcp
# or
cdr-kit-mcp

# pipe a JSON-RPC request from another process:
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | cdr-kit-mcp
```

---

## Env vars

```bash
CDR_PRIVATE_KEY=0x…   # override the on-disk wallet
CDR_NETWORK=aeneid    # aeneid | mainnet
CDR_RPC_URL=https://…
CDR_API_URL=http://…
LOG_LEVEL=debug
```

---

## Peer dependencies

None — `@cdr-kit/mcp` is bundled.

---

## Links

- Full docs: <https://cdrkit.xyz/docs/agent-kit/mcp>
- npm: <https://www.npmjs.com/package/@cdr-kit/mcp>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
- MCP spec: <https://modelcontextprotocol.io>
