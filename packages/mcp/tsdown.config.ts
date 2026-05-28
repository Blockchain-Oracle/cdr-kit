import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  treeshake: true,
  external: ["@cdr-kit/agent", "@cdr-kit/tools", "@modelcontextprotocol/sdk", "viem"],
  // Preserve the CLI shebang on the built binary.
  outputOptions: { banner: "#!/usr/bin/env node" },
});
