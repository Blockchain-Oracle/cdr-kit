import { CdrSpinner } from "@cdr-kit/react-ui";
import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";

const CODE = `import { CdrSpinner } from "@cdr-kit/react-ui";

<CdrSpinner />
<CdrSpinner size={24} />`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react-ui", "DX primitives", "CdrSpinner"],
        title: "<CdrSpinner>",
        badges: <Badge tone="primary">DX primitive</Badge>,
        lede: <>Indeterminate CSS spinner. Use when you don&apos;t have a determinate progress to show (e.g. wallet confirmation).</>,
        importLine: 'import { CdrSpinner } from "@cdr-kit/react-ui"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: (
              <Demo
                preview={
                  <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                    <CdrSpinner />
                    <CdrSpinner size={24} />
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
              <PropsTable rows={[{ name: "size", type: "number", defaultValue: "18", description: "Pixel size of the square spinner box." }]} />
            ),
          },
        ],
        prev: { href: "/docs/components/cdr-network-chip", label: "CdrNetworkChip" },
        next: { href: "/docs/components/cdr-progress", label: "CdrProgress" },
      }}
    />
  );
}
