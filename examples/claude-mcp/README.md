# cdr-kit MCP — Claude Desktop / Cursor / OpenClaw recipe

The `@cdr-kit/mcp` server is **one binary that plugs into every MCP host**. It exposes the CDR
agent tools (`cdr_discover_vaults`, `cdr_subscribe_and_access`, `cdr_access_vault`) so an LLM can
discover, pay for, and read Story CDR vaults autonomously.

## Run it

```bash
PRIVATE_KEY=0x<testnet-key> CDR_API_URL=http://172.192.41.96:1317 npx -y @cdr-kit/mcp
# stderr: [cdr-kit-mcp] running on stdio — 3 tools, wallet 0x…
```

## Claude Desktop / Cursor — `mcp` config

```json
{
  "mcpServers": {
    "cdr-kit": {
      "command": "npx",
      "args": ["-y", "@cdr-kit/mcp"],
      "env": { "PRIVATE_KEY": "0x<testnet-key>", "CDR_API_URL": "http://172.192.41.96:1317" }
    }
  }
}
```

## OpenClaw — same server, as a skill

```bash
openclaw mcp set cdr-kit '{"command":"npx","args":["-y","@cdr-kit/mcp"],"env":{"PRIVATE_KEY":"0x<testnet-key>","CDR_API_URL":"http://172.192.41.96:1317"}}'
```

That's it — no bespoke OpenClaw plugin. The MCP server is the universal surface (Claude Desktop,
Cursor, Cline, Goose, Windsurf, OpenClaw, n8n, …). For in-process code agents use the native
adapters instead: `@cdr-kit/vercel-ai`, `@cdr-kit/langchain`, `@cdr-kit/openai`.

## Verified

`pnpm --filter @cdr-kit/mcp build && node packages/mcp/scripts/verify.mjs` does a real MCP
`Client` handshake against the built server and lists the tools with their JSON schemas.

> Security: the server signs with `PRIVATE_KEY` — use a funded **testnet** key only.
