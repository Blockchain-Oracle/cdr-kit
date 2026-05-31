import { dedent } from "../util.js";
import { CDR_VERSION, type Template } from "./types.js";

export const MCP_SERVER: Template = {
  name: "mcp-server",
  description: "Drop-in stdio MCP server. Plugs into Claude Desktop / Cursor / Windsurf so an LLM can discover + subscribe to CDR vaults.",
  postInstall: [
    "pnpm install",
    "cp .env.example .env  # fill PRIVATE_KEY",
    "pnpm start            # speaks JSON-RPC over stdio",
    "# Wire into Claude Desktop / Cursor — see README",
  ],
  files: [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "cdr-kit-mcp-server",
          private: true,
          type: "module",
          scripts: { start: "cdr-kit-mcp" },
          dependencies: { "@cdr-kit/mcp": CDR_VERSION },
        },
        null,
        2,
      ),
    },
    {
      path: ".env.example",
      content: dedent(`
        # Funded Aeneid testnet wallet (the agent pays from this).
        PRIVATE_KEY=0x_your_aeneid_testnet_private_key_here

        # Optional overrides (defaults shown):
        # CDR_API_URL=https://api.story.foundation
        # CDR_RPC_URL=https://aeneid.storyrpc.io
      `),
    },
    {
      path: "claude_desktop_config.json",
      content: JSON.stringify(
        {
          mcpServers: {
            "cdr-kit": {
              command: "node",
              args: ["./node_modules/@cdr-kit/mcp/dist/index.mjs"],
              env: { PRIVATE_KEY: "0x_PASTE_KEY_HERE", CDR_API_URL: "https://api.story.foundation" },
            },
          },
        },
        null,
        2,
      ),
    },
    {
      path: "README.md",
      content: dedent(`
        # cdr-kit mcp-server

        A wired Model Context Protocol server that exposes three Story CDR tools to any MCP host (Claude Desktop, Cursor, Windsurf, custom). The agent uses its own wallet to discover, subscribe, and read confidential vaults — your LLM never sees the private key.

        ## Tools exposed
        - \`cdr_discover_vaults\` — list available vault uuids
        - \`cdr_subscribe_and_access\` — pay + decrypt in one shot
        - \`cdr_access_vault\` — decrypt a vault you're already entitled to

        ## Run locally
        \`\`\`bash
        pnpm install
        cp .env.example .env   # fill PRIVATE_KEY
        pnpm start
        \`\`\`

        ## Wire into Claude Desktop
        Add the entry from \`claude_desktop_config.json\` to your Claude Desktop config (\`~/Library/Application Support/Claude/claude_desktop_config.json\` on macOS). Replace the placeholder \`PRIVATE_KEY\`. Restart Claude.

        ## Wire into Cursor / Windsurf
        Same JSON shape — see your IDE's MCP server settings.
      `),
    },
    { path: ".gitignore", content: "node_modules\n.env\n.env.local\n" },
  ],
};

