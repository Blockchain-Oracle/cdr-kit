import { dedent } from "../util.js";
import { CDR_VERSION, type Template } from "./types.js";

export const STARTER: Template = {
  name: "starter",
  description:
    "Minimal Node script — runs the full CDR allocate → write → read flow against real Aeneid testnet.",
  postInstall: [
    "pnpm install",
    "cp .env.example .env",
    "# add your funded Aeneid testnet WALLET_PRIVATE_KEY=0x...",
    "pnpm start",
  ],
  files: [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "cdr-kit-starter",
          private: true,
          type: "module",
          scripts: { start: "tsx src/index.ts" },
          dependencies: {
            "@cdr-kit/agent": CDR_VERSION,
            "@cdr-kit/contracts": CDR_VERSION,
            "@cdr-kit/core": CDR_VERSION,
            consola: "^3.2.3",
            dotenv: "^16.4.7",
            viem: "^2.51.3",
          },
          devDependencies: { tsx: "^4.19.2", typescript: "^5.7.2", "@types/node": "^20" },
        },
        null,
        2,
      ),
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
          },
        },
        null,
        2,
      ),
    },
    {
      path: "src/index.ts",
      content: dedent(`
        import "dotenv/config";
        import { CdrAgent } from "@cdr-kit/agent";
        import { aeneid } from "@cdr-kit/contracts";
        import { consola } from "consola";

        const privateKey = process.env.WALLET_PRIVATE_KEY as \`0x\${string}\` | undefined;
        if (!privateKey) {
          consola.error("Missing WALLET_PRIVATE_KEY env. Copy .env.example to .env and add a funded Aeneid testnet wallet.");
          consola.info("Grab free testnet IP from https://aeneid.faucet.story.foundation/");
          process.exit(1);
        }

        const agent = new CdrAgent({ privateKey, rpcUrl: "https://aeneid.storyrpc.io" });
        if (!agent.address) throw new Error("agent has no wallet address");

        const secret = new TextEncoder().encode("hello from cdr-kit on real Aeneid");

        consola.start("creating real CDR vault on Aeneid…");
        const txHash = await agent.createVault({
          readConditionAddr: aeneid.openCondition as \`0x\${string}\`,
          readConfig: "0x",
        });
        consola.info(\`  tx=\${txHash}\`);

        // createVault returns just the tx hash; the uuid is in the VaultCreated event.
        // Read it off the latest vault this wallet owns.
        const owned = await agent.getCreatorVaults(agent.address);
        const latest = owned[owned.length - 1];
        if (!latest) throw new Error("createVault confirmed but no vault visible on-chain yet");
        const uuid = latest.uuid;
        consola.success(\`vault uuid=\${uuid}\`);

        consola.start("writing encrypted data via CDR precompile…");
        await agent.writeVaultData({ uuid, dataKey: secret });
        consola.success("write confirmed");

        consola.start("reading + decrypting (threshold-decrypt over the network)…");
        const bytes = await agent.access(uuid);
        consola.success(\`decrypted: \${new TextDecoder().decode(bytes)}\`);
      `),
    },
    {
      path: ".env.example",
      content: dedent(`
        # Required: funded Aeneid testnet wallet (chain ID 1315)
        # Get free testnet IP at https://aeneid.faucet.story.foundation/
        WALLET_PRIVATE_KEY=0x_your_aeneid_testnet_private_key
      `),
    },
    {
      path: "README.md",
      content: dedent(`
        # cdr-kit starter

        Runs the full CDR flow (allocate → write encrypted → threshold-decrypt read) against
        **real Aeneid testnet** — no mock. Proves your environment can talk to CDR end to end.

        \`\`\`bash
        pnpm install
        cp .env.example .env       # add your funded Aeneid testnet WALLET_PRIVATE_KEY
        pnpm start
        \`\`\`

        Need testnet IP? <https://aeneid.faucet.story.foundation/>

        Full docs: <https://cdr-kit.dev>
      `),
    },
    { path: ".gitignore", content: "node_modules\ndist\n.env\n" },
  ],
};
