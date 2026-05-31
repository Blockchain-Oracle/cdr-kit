import { dedent } from "../util.js";
import { CDR_VERSION, type Template } from "./types.js";

export const STARTER: Template = {
  name: "starter",
  description: "Minimal Node script — runs the CDR mock flow end-to-end. Good for verifying the kit works in your env.",
  postInstall: ["pnpm install", "pnpm start"],
  files: [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "cdr-kit-starter",
          private: true,
          type: "module",
          scripts: { start: "tsx src/index.ts" },
          dependencies: { "@cdr-kit/core": CDR_VERSION, consola: "^3.2.3" },
          devDependencies: { tsx: "^4.19.2", typescript: "^5.7.2" },
        },
        null,
        2,
      ),
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify(
        { compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", strict: true } },
        null,
        2,
      ),
    },
    {
      path: "src/index.ts",
      content: dedent(`
        import { createMockCdrKit } from "@cdr-kit/core";
        import { consola } from "consola";

        // Mock mode: the full CDR flow (incl. the threshold-decrypt read) with no wallet/chain.
        const kit = createMockCdrKit({ readDelayMs: 800, threshold: 4 });

        const secret = new TextEncoder().encode("hello from cdr-kit");
        const { uuid } = await kit.createVault({ data: secret });
        consola.info(\`created vault \${uuid}\`);

        consola.start("reading (simulated CDR threshold-decrypt)…");
        const data = await kit.accessVault({ uuid, onProgress: (p) => consola.info(\`  partials \${p.collected}/\${p.threshold}\`) });
        consola.success(\`decrypted: \${new TextDecoder().decode(data)}\`);
      `),
    },
    {
      path: "README.md",
      content: dedent(`
        # cdr-kit starter

        \`\`\`bash
        pnpm install
        pnpm start   # runs the mock-mode CDR flow — no wallet/chain needed
        \`\`\`

        Swap \`createMockCdrKit()\` for \`createCdrKitClient({ privateKey, apiUrl })\` + the flow helpers to go live on Aeneid. See https://github.com/Blockchain-Oracle/cdr-kit
      `),
    },
    { path: ".gitignore", content: "node_modules\ndist\n" },
  ],
};
