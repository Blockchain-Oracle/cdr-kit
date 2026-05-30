import { CdrNetworkChip } from "@cdr-kit/react-ui";
import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";

const CODE = `import { CdrNetworkChip } from "@cdr-kit/react-ui";

<CdrNetworkChip mode="live" />
<CdrNetworkChip mode="mock" />`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react-ui", "DX primitives", "CdrNetworkChip"],
        title: "<CdrNetworkChip>",
        badges: <Badge tone="primary">DX primitive</Badge>,
        lede: <>Pill with a glowing status dot indicating live vs mock mode. Drop into your app chrome so users always know whether they&apos;re hitting Aeneid or the in-memory mock.</>,
        importLine: 'import { CdrNetworkChip } from "@cdr-kit/react-ui"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: (
              <Demo
                preview={
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                    <CdrNetworkChip mode="live" />
                    <CdrNetworkChip mode="mock" />
                  </div>
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
                { name: "mode", type: '"live" | "mock"', required: true, description: "Drives the dot color and glow (signal vs warn)." },
                { name: "network", type: "string", defaultValue: '"Aeneid"', description: "Network label rendered next to the status." },
              ]} />
            ),
          },
        ],
        prev: { href: "/docs/components/ip-price", label: "IpPrice" },
        next: { href: "/docs/components/cdr-spinner", label: "CdrSpinner" },
      }}
    />
  );
}
