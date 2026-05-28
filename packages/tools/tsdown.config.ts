import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  external: ["@cdr-kit/agent", "@cdr-kit/core", "zod", "zod-to-json-schema"],
});
