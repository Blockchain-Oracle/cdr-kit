# @cdr-kit/mcp

A **Model Context Protocol** server for Story CDR — one binary that plugs into Claude Desktop, Cursor, OpenClaw, and any MCP host. Exposes the [`@cdr-kit/tools`](../tools) set (discover / subscribe / access) over stdio.

```bash
npm install -g @cdr-kit/mcp   # provides the `cdr-kit-mcp` binary
```

Configure your host (env supplies the agent's testnet wallet + Story API):

```jsonc
// Claude Desktop / Cursor mcp config
{
  "mcpServers": {
    "cdr-kit": {
      "command": "cdr-kit-mcp",
      "env": { "PRIVATE_KEY": "0x…", "STORY_API_URL": "https://…" }
    }
  }
}
```

```bash
# OpenClaw
openclaw mcp set cdr-kit cdr-kit-mcp
```

> stdio transport: the server logs only to **stderr** (stdout is the protocol channel).
