import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  external: ["@coinbase/agentkit", "@cdr-kit/agent", "@cdr-kit/tools"],
});
