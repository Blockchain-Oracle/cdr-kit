<p align="center">
  <a href="https://cdrkit.xyz">
    <img src="https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/icon.svg" alt="cdr-kit" width="80">
  </a>
</p>

# @cdr-kit/tools

> Framework-agnostic CDR agent tools — the single source of truth that every adapter maps from. 34 tools total.

Each tool is `{ name, description, schema (Zod), invoke }`. You rarely import this directly — use the adapter for your runtime.

---

## Install

```bash
pnpm add @cdr-kit/tools @cdr-kit/agent
```

---

## Quick start

```ts
import { CdrAgent } from "@cdr-kit/agent";
import { createCdrTools, toJsonSchema } from "@cdr-kit/tools";

const agent = new CdrAgent({
  privateKey: process.env.WALLET_PRIVATE_KEY as `0x${string}`,
  rpcUrl: "https://aeneid.storyrpc.io",
});

const tools = createCdrTools(agent);
// tools[i]: { name, description, schema, invoke(args) }

const jsonSchema = toJsonSchema(tools[0].schema);
```

---

## The 34 tools (split into 5 modules)

| module                | count | tools                                                                                                |
| --------------------- | ----- | ---------------------------------------------------------------------------------------------------- |
| `tools-read`          | 4     | discover_vaults, subscribe_and_access, access_vault, access_license_gated                            |
| `tools-author`        | 3     | create_vault, write_vault_data, upload_file                                                          |
| `tools-introspect`    | 6     | get_vault_info, creator_vaults, check_entitlement, estimate_cost, list_subscriptions, get_fees       |
| `tools-advanced`      | 13    | create_time_window / dead_man / escrow / multi_sig + approve / sign / access / rotate / poke / pay / confirm / claim / refund |
| `tools-story`         | 8     | register_ip, attach_license_terms, mint_license_token, publish_data, register_derivative, register_pil_terms, wrap_ip, approve_wip |

---

## Adapters

| runtime                                              | package                            |
| ---------------------------------------------------- | ---------------------------------- |
| MCP hosts (Claude Desktop, Cursor, …)                | [`@cdr-kit/mcp`](../mcp)           |
| Vercel AI SDK                                        | [`@cdr-kit/vercel-ai`](../vercel-ai) |
| OpenAI / Anthropic raw tool-calling                  | [`@cdr-kit/openai`](../openai)     |
| LangChain                                            | [`@cdr-kit/langchain`](../langchain) |
| Coinbase AgentKit                                    | [`@cdr-kit/agentkit`](../agentkit) |
| GOAT                                                 | [`@cdr-kit/goat`](../goat)         |

---

## Peer dependencies

- `@cdr-kit/agent` ≥ 0.7.0
- `viem` ≥ 2.21

---

## Links

- Full docs: <https://cdrkit.xyz/docs/agent-kit>
- npm: <https://www.npmjs.com/package/@cdr-kit/tools>
- GitHub: <https://github.com/Blockchain-Oracle/cdr-kit>
