import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { CdrAgent } from "@cdr-kit/agent";

/**
 * A framework-agnostic CDR tool. This shape is the single source of truth: the MCP server and
 * every framework adapter (Vercel AI / LangChain / OpenAI / AgentKit / GOAT) map from it.
 * Descriptions are written FOR THE MODEL — they're how an LLM decides whether/how to call us.
 */
export interface CdrTool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  invoke: (input: unknown) => Promise<unknown>;
}

const decode = (b: Uint8Array) => new TextDecoder().decode(b);

const discoverSchema = z.object({
  fromBlock: z.number().int().nonnegative().optional().describe("Optional start block for the event scan"),
});
const subscribeSchema = z.object({
  uuid: z.number().int().describe("The vault UUID to subscribe to"),
  periods: z.number().int().min(1).default(1).describe("Number of subscription periods to pay for"),
  maxPricePerPeriodWei: z.string().describe("Max price per period, in wei, as a decimal string"),
});
const accessSchema = z.object({
  uuid: z.number().int().describe("The vault UUID to read"),
  accessAuxData: z
    .string()
    .optional()
    .describe("Optional 0x-hex aux data (e.g. an ABI-encoded license tokenId for tier-gated vaults)"),
});

/** Build the CDR tool set over an agent (its own wallet). Each tool validates its own input. */
export function createCdrTools(agent: CdrAgent): CdrTool[] {
  return [
    {
      name: "cdr_discover_vaults",
      description:
        "Discover Story CDR data vaults (returns each vault's uuid, ipId, creator). Call this first to find a vault to read or subscribe to.",
      inputSchema: discoverSchema,
      invoke: async (raw) => {
        const { fromBlock } = discoverSchema.parse(raw);
        const vaults = await agent.discover(fromBlock !== undefined ? { fromBlock: BigInt(fromBlock) } : undefined);
        return vaults.map((v) => ({ uuid: v.uuid, ipId: v.ipId, creator: v.creator, tokenId: v.tokenId.toString() }));
      },
    },
    {
      name: "cdr_subscribe_and_access",
      description:
        "Subscribe to (pay for) a subscription-gated Story CDR vault from the agent's own wallet, then read and decrypt it. Returns the decrypted text. Use when the agent is not yet subscribed.",
      inputSchema: subscribeSchema,
      invoke: async (raw) => {
        const { uuid, periods, maxPricePerPeriodWei } = subscribeSchema.parse(raw);
        const price = BigInt(maxPricePerPeriodWei);
        const data = await agent.subscribeAndAccess({
          uuid,
          periods: BigInt(periods),
          maxPricePerPeriod: price,
          value: price * BigInt(periods),
        });
        return { uuid, text: decode(data) };
      },
    },
    {
      name: "cdr_access_vault",
      description:
        "Read and decrypt a Story CDR vault the agent is already entitled to (already subscribed, or holds the required license). Returns the decrypted text.",
      inputSchema: accessSchema,
      invoke: async (raw) => {
        const { uuid, accessAuxData } = accessSchema.parse(raw);
        const data = await agent.access(uuid, accessAuxData as `0x${string}` | undefined);
        return { uuid, text: decode(data) };
      },
    },
  ];
}

/** JSON Schema for a tool's input — feeds the OpenAI/Anthropic/MCP adapters. */
export function toJsonSchema(tool: CdrTool): Record<string, unknown> {
  return zodToJsonSchema(tool.inputSchema, { target: "openApi3" }) as Record<string, unknown>;
}
