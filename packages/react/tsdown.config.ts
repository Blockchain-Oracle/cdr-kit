import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  treeshake: true,
  external: ["react", "react/jsx-runtime", "wagmi", "viem", "@tanstack/react-query", "@cdr-kit/core", "@cdr-kit/contracts"],
  // Preserve the React Server Components boundary: every entry is a client module.
  outputOptions: { banner: '"use client";' },
});
