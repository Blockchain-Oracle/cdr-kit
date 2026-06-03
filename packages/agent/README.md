<p align="center">
  <a href="https://cdrkit.xyz">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark-dark.svg">
      <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/logo-wordmark.svg" alt="cdr-kit" width="200">
    </picture>
  </a>
</p>


# @cdr-kit/agent

> Autonomous-agent client for Story Confidential Data Rails — wallet, discovery, subscribe, decrypt, advanced conditions, IP integration.

The headless counterpart to `@cdr-kit/react`. An agent owns its own wallet, discovers vaults, subscribes, decrypts plaintext, and (in 0.5+) drives the 4 advanced-condition flows (TimeWindow, DeadManSwitch, ConditionalEscrow, MultiSig) plus the full Story IP author surface.

This is the object every framework adapter wraps — see [`@cdr-kit/vercel-ai`](../vercel-ai), [`@cdr-kit/openai`](../openai), [`@cdr-kit/langchain`](../langchain), [`@cdr-kit/agentkit`](../agentkit), [`@cdr-kit/goat`](../goat), and [`@cdr-kit/mcp`](../mcp).

---

## Install

```bash
pnpm add @cdr-kit/agent @cdr-kit/core @cdr-kit/contracts viem
```

---

## Quick start

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { aeneid, cdrKitVaultAbi } from "@cdr-kit/contracts";
import { parseEventLogs } from "viem";

const agent = new CdrAgent({
  privateKey: process.env.WALLET_PRIVATE_KEY as `0x${string}`,
  rpcUrl: "https://aeneid.storyrpc.io",
});

// 1. create a vault using OpenCondition (always-allow read)
const fees = await agent.getFees();
const txHash = await agent.createVault({
  readConditionAddr: aeneid.openCondition,
  readConfig: "0x",
  valueWei: fees.allocateWei,
});

// 2. read the uuid from the VaultCreated event in the receipt
const receipt = await agent.client.publicClient.waitForTransactionReceipt({ hash: txHash });
const events = parseEventLogs({ abi: cdrKitVaultAbi, logs: receipt.logs, eventName: "VaultCreated" });
const uuid = Number(events[0]!.args.uuid);

// 3. write encrypted data
await agent.writeVaultData({ uuid, dataKey: new TextEncoder().encode("hello CDR") });

// 4. decrypt (threshold-decrypt over the validator network)
const bytes = await agent.access(uuid);
console.log(new TextDecoder().decode(bytes)); // "hello CDR"
```

---

## What `CdrAgent` exposes

```ts
// wallet + network
agent.address       // EOA
agent.network       // chain config
agent.client        // CdrKitClient (publicClient, walletClient, cdr SDK)
agent.getFees()     // { allocateWei, writeWei, readWei, threshold }

// core flow
agent.createVault({ readConditionAddr, readConfig, valueWei })
agent.writeVaultData({ uuid, dataKey })
agent.access(uuid)
agent.subscribeAndAccess({ uuid, periods, maxPricePerPeriod, value })

// 0.5 advanced
agent.createTimeWindowVault({ startTs, endTs, blockBased })
agent.createDeadManVault({ duration, heirs, publicAfterUnlock })
agent.createEscrowVault({ price, timeoutSecs, seller, arbiter })
agent.createMultiSigVault({ signers, threshold })
agent.escrowPay({ uuid, price })
agent.escrowConfirm(uuid)
agent.multiSigApprove({ uuid, expectedEpoch })
agent.multiSigSign({ uuid, caller, deadline })
agent.accessMultiSig({ uuid, deadline, sigs })

// Story IP integration (lazy — needs @cdr-kit/story)
agent.registerIP(...)
agent.attachLicenseTerms(...)
agent.mintLicenseToken(...)
agent.publish(...)
```

---

## Demos

- **Scripted loop (no LLM):** `pnpm --filter @cdr-kit/agent run demo` — a seller vaults a signal; the agent discovers it, subscribes from its own wallet, decrypts, makes a decision. Live on Aeneid.
- **Model-in-the-loop:** [`examples/vercel-ai-chatbot`](../../examples/vercel-ai-chatbot) — an LLM is handed the CDR tools and autonomously calls `cdr_discover_vaults` → `cdr_subscribe_and_access`, then answers from the decrypted data.

---

## Peer dependencies

- `@cdr-kit/core` ≥ 0.7.0
- `@cdr-kit/contracts` ≥ 0.7.0
- `viem` ≥ 2.21

---

## Links

- Full docs: <https://cdrkit.xyz/docs/agent-kit>
- npm: <https://www.npmjs.com/package/@cdr-kit/agent>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
- Story Protocol: <https://www.story.foundation>
