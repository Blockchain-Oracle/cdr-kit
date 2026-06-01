import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/lib.ts"],
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  // Shebang only on the bin (src/index.ts → dist/index.mjs); the library entry must not carry one.
  outputOptions: {
    banner: (chunk) => (chunk.facadeModuleId?.endsWith("/cli/src/index.ts") ? "#!/usr/bin/env node" : ""),
  },
  external: [
    "@cdr-kit/agent",
    "@cdr-kit/contracts",
    "@cdr-kit/core",
    "@cdr-kit/tools",
    "@modelcontextprotocol/sdk",
    "@modelcontextprotocol/sdk/server/mcp.js",
    "@modelcontextprotocol/sdk/server/stdio.js",
    "commander",
    "env-paths",
    "open",
    "pino",
    "viem",
  ],
});
