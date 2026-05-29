import { describe, it, expect, vi } from "vitest";
import { generateText, stepCountIs } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import type { CdrAgent } from "@cdr-kit/agent";
import { getVercelAITools } from "../src/index.js";

// A deterministic model-in-the-loop test: a scripted mock LLM drives the real `generateText` agentic
// loop, choosing CDR tools by name. No API key, no chain — proves the model -> tool -> model wiring.
const usage = { inputTokens: 1, outputTokens: 1, totalTokens: 2 };
const toolCall = (toolName: string, input: string) => ({
  content: [{ type: "tool-call", toolCallId: `c-${toolName}`, toolName, input }],
  finishReason: "tool-calls",
  usage,
  warnings: [],
});
const finalText = (text: string) => ({ content: [{ type: "text", text }], finishReason: "stop", usage, warnings: [] });

describe("autonomous model loop (vercel-ai)", () => {
  it("an LLM drives discover -> subscribe -> answer using only the CDR tools", async () => {
    const discover = vi.fn(async () => [{ uuid: 1, ipId: "0x01", creator: "0x02", tokenId: 7n }]);
    const subscribeAndAccess = vi.fn(async () => new TextEncoder().encode("ETH/USD bullish 0.82"));
    const agent = { discover, subscribeAndAccess, access: vi.fn() } as unknown as CdrAgent;

    // Scripted turns, served by our own counter (the SDK mock's array form has an off-by-one).
    const turns = [
      toolCall("cdr_discover_vaults", "{}"),
      toolCall("cdr_subscribe_and_access", JSON.stringify({ uuid: 1, periods: 1, maxPricePerPeriodWei: "100" })),
      finalText("The vault holds: ETH/USD bullish 0.82 — recommend BUY."),
    ];
    let turn = 0;
    const model = new MockLanguageModelV3({ doGenerate: async () => turns[turn++]! });

    const result = await generateText({
      model,
      tools: getVercelAITools(agent),
      stopWhen: stepCountIs(5),
      prompt: "Discover a CDR vault, subscribe to it, read it, and summarize what's inside.",
    });

    // the model autonomously chose the two action tools, in order
    const toolNames = result.steps.flatMap((s) => s.toolCalls.map((c) => c.toolName));
    expect(toolNames).toEqual(["cdr_discover_vaults", "cdr_subscribe_and_access"]);
    // and the tools actually executed against the agent, with wei strings coerced to bigint
    expect(discover).toHaveBeenCalledOnce();
    expect(subscribeAndAccess).toHaveBeenCalledWith({ uuid: 1, periods: 1n, maxPricePerPeriod: 100n, value: 100n });
    // and the final answer reflects the decrypted data
    expect(result.text).toContain("BUY");
  });
});
