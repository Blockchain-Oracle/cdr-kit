import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_JSON = JSON.stringify(
  {
    name: "cdr-kit-starter",
    private: true,
    type: "module",
    scripts: { start: "tsx src/index.ts" },
    dependencies: { "@cdr-kit/core": "latest", consola: "^3.2.3" },
    devDependencies: { tsx: "^4.19.2", typescript: "^5.7.2" },
  },
  null,
  2,
);

const TSCONFIG = JSON.stringify(
  { compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", strict: true } },
  null,
  2,
);

const INDEX_TS = `import { createMockCdrKit } from "@cdr-kit/core";
import { consola } from "consola";

// Mock mode: the full CDR flow (incl. the threshold-decrypt read) with no wallet/chain.
const kit = createMockCdrKit({ readDelayMs: 800, threshold: 4 });

const secret = new TextEncoder().encode("hello from cdr-kit");
const { uuid } = await kit.createVault({ data: secret });
consola.info(\`created vault \${uuid}\`);

consola.start("reading (simulated CDR threshold-decrypt)…");
const data = await kit.accessVault({ uuid, onProgress: (p) => consola.info(\`  partials \${p.collected}/\${p.threshold}\`) });
consola.success(\`decrypted: \${new TextDecoder().decode(data)}\`);
`;

const README = `# cdr-kit starter

\`\`\`bash
pnpm install
pnpm start   # runs the mock-mode CDR flow — no wallet/chain needed
\`\`\`

Swap \`createMockCdrKit()\` for \`createCdrKitClient({ privateKey, apiUrl })\` + the flow helpers to go live on Aeneid. See https://github.com/Blockchain-Oracle/cdr-kit
`;

/** Write the starter files into `target`. Exported for tests. */
export function scaffold(target: string): void {
  if (existsSync(target)) throw new Error(`refusing to overwrite existing path: ${target}`);
  mkdirSync(join(target, "src"), { recursive: true });
  writeFileSync(join(target, "package.json"), PKG_JSON);
  writeFileSync(join(target, "tsconfig.json"), TSCONFIG);
  writeFileSync(join(target, "src", "index.ts"), INDEX_TS);
  writeFileSync(join(target, "README.md"), README);
  writeFileSync(join(target, ".gitignore"), "node_modules\ndist\n");
}

// CLI entry (skipped when imported, e.g. by tests).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) {
    process.stderr.write("usage: create-cdr-kit-app <dir>\n");
    process.exit(1);
  }
  scaffold(target);
  process.stdout.write(`✓ scaffolded ${target}\n  cd ${target} && pnpm install && pnpm start\n`);
}
