// Real MCP handshake against the built server: spawn it via StdioClientTransport, list tools, call one.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(here, "../dist/index.mjs");

const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath], env: process.env });
const client = new Client({ name: "cdr-kit-verify", version: "0.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log("MCP tools:", tools.map((t) => t.name).join(", "));
console.log("input schema (discover):", JSON.stringify(tools.find((t) => t.name === "cdr_discover_vaults")?.inputSchema));

await client.close();
process.exit(tools.length === 3 ? 0 : 1);
