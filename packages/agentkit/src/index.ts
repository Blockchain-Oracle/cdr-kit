import { customActionProvider } from "@coinbase/agentkit";
import type { CdrAgent } from "@cdr-kit/agent";
import { createCdrTools } from "@cdr-kit/tools";

/**
 * Adapt CDR tools into a single Coinbase AgentKit action provider.
 * Uses `customActionProvider` (no decorators / no `experimentalDecorators` needed). Each `invoke`
 * is arity-1, so AgentKit treats it as a wallet-less action; AgentKit runs `schema.parse(args)`
 * before calling. Returns strings (AgentKit actions are typed `Promise<string>`).
 *
 *   const ak = await AgentKit.from({ walletProvider, actionProviders: [getCdrActionProvider(agent)] });
 */
export function getCdrActionProvider(agent: CdrAgent) {
  return customActionProvider(
    createCdrTools(agent).map((t) => ({
      name: t.name,
      description: t.description,
      schema: t.inputSchema,
      invoke: async (args: unknown) => {
        const result = await t.invoke(args);
        return typeof result === "string" ? result : JSON.stringify(result);
      },
    })),
  );
}
