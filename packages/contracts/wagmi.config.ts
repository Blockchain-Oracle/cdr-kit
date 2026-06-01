import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

// Generates typed ABIs (as const) from the Foundry artifacts. The React layer (@cdr-kit/react)
// adds the `react()` plugin for hooks; this package stays pure TS so it has no React dep.
export default defineConfig({
  out: "src/generated.ts",
  plugins: [
    foundry({
      project: "../../contracts",
      artifacts: "out",
      include: [
        "CdrKitVault.sol/**",
        "ICdrCondition.sol/**",
        "SubscriptionCondition.sol/**",
        "TierGateCondition.sol/**",
        "ComposableCondition.sol/**",
        "CreatorWriteCondition.sol/**",
        "OpenCondition.sol/**",
        "TimeWindowCondition.sol/**",
        "DeadManSwitchCondition.sol/**",
        "ConditionalEscrowCondition.sol/**",
        "MultiSigCondition.sol/**",
      ],
      forge: { build: true },
    }),
  ],
});
