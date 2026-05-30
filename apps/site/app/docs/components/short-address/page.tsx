import { ShortAddress } from "@cdr-kit/react-ui";
import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";

const CODE = `import { ShortAddress } from "@cdr-kit/react-ui";

<ShortAddress address="0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C" />`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react-ui", "DX primitives", "ShortAddress"],
        title: "<ShortAddress>",
        badges: <Badge tone="primary">DX primitive</Badge>,
        lede: <>Truncated mono address chip with an inline <code>&lt;CopyButton&gt;</code>. The chip&apos;s default truncation is 6 / 4 (head / tail).</>,
        importLine: 'import { ShortAddress } from "@cdr-kit/react-ui"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: (
              <Demo
                preview={<ShortAddress address="0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C" />}
                code={CODE}
              />
            ),
          },
          {
            id: "props",
            title: "Props",
            content: (
              <PropsTable rows={[
                { name: "address", type: "string", required: true, description: "The full hex address (or any string) to render + copy." },
                { name: "head", type: "number", defaultValue: "6", description: "Leading characters to keep (after the 0x prefix)." },
                { name: "tail", type: "number", defaultValue: "4", description: "Trailing characters to keep." },
                { name: "copyable", type: "boolean", defaultValue: "true", description: "Show the inline copy button." },
              ]} />
            ),
          },
        ],
        prev: { href: "/docs/components/copy-button", label: "CopyButton" },
        next: { href: "/docs/components/explorer-link", label: "ExplorerLink" },
      }}
    />
  );
}
