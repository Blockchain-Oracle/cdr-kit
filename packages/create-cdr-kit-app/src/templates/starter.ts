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
        import { aeneid, cdrKitVaultAbi } from "@cdr-kit/contracts";
        import { encodeAbiParameters, parseEventLogs } from "viem";
        import { consola } from "consola";

        const privateKey = process.env.WALLET_PRIVATE_KEY as \`0x\${string}\` | undefined;
        if (!privateKey) {
          consola.error("Missing WALLET_PRIVATE_KEY env. Copy .env.example to .env and add a funded Aeneid testnet wallet.");
          consola.info("Grab free testnet IP from https://aeneid.faucet.story.foundation/");
          process.exit(1);
        }

        const agent = new CdrAgent({ privateKey, rpcUrl: "https://aeneid.storyrpc.io" });

        const secret = new TextEncoder().encode("hello from cdr-kit on real Aeneid");

        // The CDR precompile charges an allocate fee — must be passed as msg.value or
        // createVault reverts with "CDR: Invalid fee amount". Read it live from the chain.
        const fees = await agent.getFees();
        consola.info(\`  allocate fee: \${fees.allocateWei} wei\`);

        // TimeWindowCondition with (startTs=1, endTs=0) = "always open from genesis, no upper
        // bound" — the cleanest factory-compatible "always allow" gate on the current Aeneid
        // deployment. OpenCondition exists but isn't yet ConditionBase-derived so the factory
        // _configure() step reverts (planned 0.7.x contract fix).
        const readConfig = encodeAbiParameters(
          [{ type: "uint64" }, { type: "uint64" }, { type: "bool" }],
          [1n, 0n, false], // startTs=1 → since genesis, endTs=0 → forever, time-based (not block)
        );

        consola.start("creating real CDR vault on Aeneid…");
        const txHash = await agent.createVault({
          readConditionAddr: aeneid.timeWindowCondition as \`0x\${string}\`,
          readConfig,
          valueWei: fees.allocateWei,
        });
        consola.info(\`  tx=\${txHash}\`);

        // createVault returns just the tx hash. The uuid is in the VaultCreated event —
        // parse the receipt directly (avoids the post-tx read race in getCreatorVaults).
        const receipt = await agent.client.publicClient.waitForTransactionReceipt({ hash: txHash });
        const events = parseEventLogs({ abi: cdrKitVaultAbi, logs: receipt.logs, eventName: "VaultCreated" });
        if (events.length === 0) throw new Error("createVault tx confirmed but no VaultCreated event found");
        const uuid = Number(events[0]!.args.uuid);
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
