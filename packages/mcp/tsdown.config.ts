import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  treeshake: true,
  define: {
    __PKG_VERSION__: JSON.stringify(pkg.version),
  },
  external: [
    "@cdr-kit/agent",
    "@cdr-kit/cli",
    "@cdr-kit/tools",
    "@modelcontextprotocol/sdk",
    "@modelcontextprotocol/sdk/server/stdio.js",
    "viem",
  ],
  // Preserve the CLI shebang on the built binary.
  outputOptions: { banner: "#!/usr/bin/env node" },
});
