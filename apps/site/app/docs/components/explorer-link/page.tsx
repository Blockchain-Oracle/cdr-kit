import { ExplorerLink } from "@cdr-kit/react-ui";
import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";

const CODE = `import { ExplorerLink } from "@cdr-kit/react-ui";

<ExplorerLink href="https://aeneid.storyrpc.io/address/0xac592f…">
  view on Aeneid
</ExplorerLink>`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react-ui", "DX primitives", "ExplorerLink"],
        title: "<ExplorerLink>",
        badges: <Badge tone="primary">DX primitive</Badge>,
        lede: <>Mono primary-colored link with an external-link icon. Opens in a new tab with <code>rel=&quot;noopener noreferrer&quot;</code>.</>,
        importLine: 'import { ExplorerLink } from "@cdr-kit/react-ui"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: (
              <Demo
                preview={
                  <ExplorerLink href="https://aeneid.storyrpc.io/address/0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C">
                    view on Aeneid
                  </ExplorerLink>
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
                { name: "href", type: "string", required: true, description: "Target URL (typically a block-explorer address / tx page)." },
                { name: "children", type: "ReactNode", defaultValue: '"view"', description: "Link label." },
              ]} />
            ),
          },
        ],
        prev: { href: "/docs/components/short-address", label: "ShortAddress" },
        next: { href: "/docs/components/ip-price", label: "IpPrice" },
      }}
    />
  );
}
