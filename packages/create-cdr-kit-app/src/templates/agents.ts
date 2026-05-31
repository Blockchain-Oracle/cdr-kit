import { dedent } from "../util.js";
import { CDR_VERSION, type Template, type TemplateName } from "./types.js";

export function agentTemplate(opts: {
  name: TemplateName;
  description: string;
  adapter: string;
  extraDeps: Record<string, string>;
  envHint?: string;
  indexTs: string;
}): Template {
  return {
    name: opts.name,
    description: opts.description,
    postInstall: ["pnpm install", "cp .env.example .env  # fill keys", "pnpm start"],
    files: [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: opts.name,
            private: true,
            type: "module",
            scripts: { start: "tsx src/index.ts" },
            dependencies: {
              "@cdr-kit/agent": CDR_VERSION,
              "@cdr-kit/contracts": CDR_VERSION,
              "@cdr-kit/core": CDR_VERSION,
              [opts.adapter]: CDR_VERSION,
              consola: "^3.2.3",
              ...opts.extraDeps,
            },
            devDependencies: { "@types/node": "^20", tsx: "^4.19.2", typescript: "^5.7.2" },
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
              lib: ["ES2022", "DOM"],
              types: ["node"],
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
        path: ".env.example",
        content: dedent(`
          # Funded Aeneid testnet wallet — the agent pays from this.
          PRIVATE_KEY=0x_your_aeneid_testnet_private_key

          # LLM key (varies by adapter)
          ${opts.envHint ?? "OPENAI_API_KEY=sk-..."}
        `),
      },
      { path: "src/index.ts", content: opts.indexTs },
      {
        path: "README.md",
        content: dedent(`
          # ${opts.name}

          ${opts.description}

          \`\`\`bash
          pnpm install
          cp .env.example .env   # fill keys
          pnpm start
          \`\`\`

          The agent uses ${opts.adapter} to expose CDR tools to the LLM. The agent's own wallet pays for subscriptions; decryption happens locally inside the agent process.
        `),
      },
      { path: ".gitignore", content: "node_modules\n.env\ndist\n" },
    ],
  };
}

export const AGENT_VERCEL_AI = agentTemplate({
  name: "agent-vercel-ai",
  description: "Vercel AI SDK chatbot — discovers + subscribes + decides over CDR vaults using @cdr-kit/vercel-ai tools.",
  adapter: "@cdr-kit/vercel-ai",
  extraDeps: { ai: "^5.0.0", "@ai-sdk/openai": "^2.0.0" },
  indexTs: dedent(`
    import "dotenv/config";
    import { CdrAgent } from "@cdr-kit/agent";
    import { getVercelAITools } from "@cdr-kit/vercel-ai";
    import { generateText } from "ai";
    import { openai } from "@ai-sdk/openai";
    import { consola } from "consola";

    const pk = process.env.PRIVATE_KEY as \`0x\${string}\`;
    if (!pk) throw new Error("PRIVATE_KEY env required");

    const agent = new CdrAgent({ privateKey: pk, apiUrl: "https://api.story.foundation" });
    const tools = getVercelAITools(agent);

    consola.start("asking the agent to discover and describe a vault…");
    const out = await generateText({
      model: openai("gpt-4o-mini"),
      tools,
      stopWhen: ({ steps }) => steps.length >= 6,
      prompt: "Discover the most recent CDR vaults and tell me their uuids + creators in a short bulleted list.",
    });
    consola.success(out.text);
  `),
});

export const AGENT_OPENAI = agentTemplate({
  name: "agent-openai",
  description: "Raw OpenAI / Anthropic tool-calling — uses @cdr-kit/openai's function-tool spec + dispatch.",
  adapter: "@cdr-kit/openai",
  extraDeps: { openai: "^4.78.0", dotenv: "^16.4.5" },
  indexTs: dedent(`
    import "dotenv/config";
    import { CdrAgent } from "@cdr-kit/agent";
    import { getOpenAITools } from "@cdr-kit/openai";
    import OpenAI from "openai";
    import { consola } from "consola";

    const pk = process.env.PRIVATE_KEY as \`0x\${string}\`;
    if (!pk) throw new Error("PRIVATE_KEY env required");
    const client = new OpenAI();

    const agent = new CdrAgent({ privateKey: pk, apiUrl: "https://api.story.foundation" });
    const { tools, dispatch } = getOpenAITools(agent);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "user", content: "Discover available CDR vaults; pick one and read it." },
    ];

    for (let step = 0; step < 6; step++) {
      const res = await client.chat.completions.create({ model: "gpt-4o-mini", messages, tools });
      const msg = res.choices[0].message;
      messages.push(msg);
      if (!msg.tool_calls?.length) { consola.success(msg.content); break; }
      for (const tc of msg.tool_calls) {
        consola.info(\`tool: \${tc.function.name}\`);
        const result = await dispatch(tc.function.name, tc.function.arguments);
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      }
    }
  `),
});

export const AGENT_LANGCHAIN = agentTemplate({
  name: "agent-langchain",
  description: "LangChain ReAct-style agent — wraps CDR tools as LangChain StructuredTools and runs an executor.",
  adapter: "@cdr-kit/langchain",
  extraDeps: { "@langchain/core": "^0.3.0", "@langchain/openai": "^0.3.0", "@langchain/langgraph": "^0.2.0", langchain: "^0.3.0", dotenv: "^16.4.5" },
  indexTs: dedent(`
    import "dotenv/config";
    import { CdrAgent } from "@cdr-kit/agent";
    import { getLangChainTools } from "@cdr-kit/langchain";
    import { ChatOpenAI } from "@langchain/openai";
    import { createReactAgent } from "@langchain/langgraph/prebuilt";
    import { consola } from "consola";

    const pk = process.env.PRIVATE_KEY as \`0x\${string}\`;
    if (!pk) throw new Error("PRIVATE_KEY env required");

    const agent = new CdrAgent({ privateKey: pk, apiUrl: "https://api.story.foundation" });
    const tools = getLangChainTools(agent);

    const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });
    const executor = createReactAgent({ llm, tools });

    const res = await executor.invoke({ messages: [{ role: "user", content: "Discover the most recent CDR vault and tell me its uuid + creator." }] });
    consola.success(res.messages.at(-1)?.content);
  `),
});

export const AGENT_AGENTKIT = agentTemplate({
  name: "agent-agentkit",
  description: "Coinbase AgentKit — CDR tools as an AgentKit action provider that you compose with wallet + other providers.",
  adapter: "@cdr-kit/agentkit",
  extraDeps: { "@coinbase/agentkit": "^0.3.0", dotenv: "^16.4.5" },
  indexTs: dedent(`
    import "dotenv/config";
    import { CdrAgent } from "@cdr-kit/agent";
    import { getCdrActionProvider } from "@cdr-kit/agentkit";
    import { consola } from "consola";

    const pk = process.env.PRIVATE_KEY as \`0x\${string}\`;
    if (!pk) throw new Error("PRIVATE_KEY env required");

    const agent = new CdrAgent({ privateKey: pk, apiUrl: "https://api.story.foundation" });
    const provider = getCdrActionProvider(agent);

    consola.info(\`registered CDR action provider with \${provider.actionProviders?.length ?? "n"} actions\`);
    consola.info("compose into AgentKit.from({ walletProvider, actionProviders: [provider, ...] }) — see README.");
  `),
});

export const AGENT_GOAT = agentTemplate({
  name: "agent-goat",
  description: "GOAT SDK — CDR tools as GOAT ToolBase[] for the on-chain agent framework.",
  adapter: "@cdr-kit/goat",
  extraDeps: { "@goat-sdk/core": "^0.5.0", dotenv: "^16.4.5" },
  indexTs: dedent(`
    import "dotenv/config";
    import { CdrAgent } from "@cdr-kit/agent";
    import { getGoatTools } from "@cdr-kit/goat";
    import { consola } from "consola";

    const pk = process.env.PRIVATE_KEY as \`0x\${string}\`;
    if (!pk) throw new Error("PRIVATE_KEY env required");

    const agent = new CdrAgent({ privateKey: pk, apiUrl: "https://api.story.foundation" });
    const tools = getGoatTools(agent);

    consola.success(\`GOAT tools ready: \${tools.map((t) => t.name).join(", ")}\`);
    consola.info("Wire into your GOAT-based agent runtime — see README.");
  `),
});
