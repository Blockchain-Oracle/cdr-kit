import { CopyButton } from "@cdr-kit/react-ui";
import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";

const CODE = `import { CopyButton } from "@cdr-kit/react-ui";

<CopyButton value="0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C" />`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react-ui", "DX primitives", "CopyButton"],
        title: "<CopyButton>",
        badges: <Badge tone="primary">DX primitive</Badge>,
        lede: <>Minimal copy-to-clipboard control. Flashes a check icon for 1.4s on success. Composes inside other primitives (e.g. <code>&lt;ShortAddress&gt;</code>).</>,
        importLine: 'import { CopyButton } from "@cdr-kit/react-ui"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: (
              <Demo
                preview={
                  <span className="cdr-ui-addr-chip" data-cdr-ui="">
                    sample value
                    <CopyButton value="sample value" />
                  </span>
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
                { name: "value", type: "string", required: true, description: "Text written to the clipboard on click." },
                { name: "label", type: "string", defaultValue: '"copy"', description: "ARIA label for the button." },
                { name: "className", type: "string", description: "Custom class — defaults to none; style via the wrapping chip." },
              ]} />
            ),
          },
        ],
        prev: { href: "/docs/components/vault-card", label: "VaultCard" },
        next: { href: "/docs/components/short-address", label: "ShortAddress" },
      }}
    />
  );
}
