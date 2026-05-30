"use client";

import { CdrError } from "@cdr-kit/react-ui";
import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";

const CODE = `import { CdrError } from "@cdr-kit/react-ui";

<CdrError
  title="Read timed out"
  message="Threshold not met in time."
  onRetry={() => refetch()}
/>`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react-ui", "DX primitives", "CdrError"],
        title: "<CdrError>",
        badges: <Badge tone="primary">DX primitive</Badge>,
        lede: <>Soft-bordered danger state with an optional retry CTA. Pair with caught errors from <code>useAccessVault</code> or <code>useSubscribeAndAccess</code>.</>,
        importLine: 'import { CdrError } from "@cdr-kit/react-ui"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: (
              <Demo
                preview={
                  <CdrError
                    title="Read timed out"
                    message="Threshold not met in time."
                    onRetry={() => undefined}
                  />
                }
                code={CODE}
              />
            ),
          },
          {
            id: "props",
            title: "Props",
            content: (
              <PropsTable rows={[
                { name: "title", type: "ReactNode", required: true, description: "Bold first line — the error title." },
                { name: "message", type: "ReactNode", description: "Optional detail line below the title." },
                { name: "onRetry", type: "() => void", description: "When set, renders the retry button on the right." },
                { name: "retryLabel", type: "string", defaultValue: '"Retry"', description: "Retry button label." },
              ]} />
            ),
          },
        ],
        prev: { href: "/docs/components/cdr-progress", label: "CdrProgress" },
        next: { href: "/docs/agent-kit", label: "Agent kit" },
      }}
    />
  );
}
