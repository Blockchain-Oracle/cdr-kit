import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

export default defineConfig({
  entry: ["src/index.ts", "src/lib.ts"],
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  define: {
    __PKG_VERSION__: JSON.stringify(pkg.version),
  },
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
