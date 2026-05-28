import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  external: ["@piplabs/cdr-sdk", "@piplabs/cdr-crypto", "viem", "@cdr-kit/contracts", "zod"],
});
