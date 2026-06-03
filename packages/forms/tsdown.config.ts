import { defineConfig } from "tsdown";

export default defineConfig([
  // Client entry: every TSX file uses hooks/context, so banner the whole bundle as a
  // React Server Components client module (mirrors @cdr-kit/react).
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    treeshake: true,
    external: ["react", "react/jsx-runtime", "@cdr-kit/react", "@cdr-kit/core", "@cdr-kit/contracts"],
    outputOptions: { banner: '"use client";' },
  },
  // Server entry: lazy-loads @cdr-kit/agent at runtime — never bundle it.
  {
    entry: ["src/server.ts"],
    format: ["esm", "cjs"],
    dts: true,
    treeshake: true,
    external: ["@cdr-kit/agent", "@cdr-kit/core", "@cdr-kit/contracts", "viem", "consola", "server-only"],
  },
]);
