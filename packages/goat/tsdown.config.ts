import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  external: ["@goat-sdk/core", "@cdr-kit/agent", "@cdr-kit/tools"],
});
