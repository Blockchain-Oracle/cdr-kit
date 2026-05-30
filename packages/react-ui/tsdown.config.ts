import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  outputOptions: { banner: '"use client";' },
  external: [
    "react",
    "react/jsx-runtime",
    "@cdr-kit/react",
    "@cdr-kit/core",
    "@cdr-kit/contracts",
    "viem",
  ],
});
