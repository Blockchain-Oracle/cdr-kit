import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/.source/**",
      "**/generated.ts",
      "**/node_modules/**",
      "contracts/**",
      "**/*.config.*",
      // Scaffolder templates are stringified codegen — they're conceptually configs that
      // happen to be .ts files. The 400-line cap doesn't make sense for these and any split
      // would just scatter a single conceptual artifact across multiple files.
      "packages/create-cdr-kit-app/src/templates/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Abu's hard rule: ~400 lines max per file (codegen + configs are ignored above).
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 80, skipBlankLines: true, skipComments: true }],
    },
  },
);
