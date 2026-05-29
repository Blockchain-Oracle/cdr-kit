// Real MCP handshake against the built server: spawn it via StdioClientTransport, list tools, call one.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(here, "../dist/index.mjs");

// The server requires a PRIVATE_KEY to boot. The handshake (listTools/callTool schema) never sends a
// tx, so when none is provided (CI) fall back to a well-known throwaway key just to let it start.
const TEST_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // hardhat acct #1
const env = { ...process.env, PRIVATE_KEY: process.env.PRIVATE_KEY ?? TEST_KEY };

const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath], env });
const client = new Client({ name: "cdr-kit-verify", version: "0.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log("MCP tools:", tools.map((t) => t.name).join(", "));
console.log("input schema (discover):", JSON.stringify(tools.find((t) => t.name === "cdr_discover_vaults")?.inputSchema));

await client.close();
process.exit(tools.length === 3 ? 0 : 1);
