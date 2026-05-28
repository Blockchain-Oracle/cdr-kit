import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  outputOptions: { banner: "#!/usr/bin/env node" },
});
