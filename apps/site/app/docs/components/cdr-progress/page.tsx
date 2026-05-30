import { CdrProgress } from "@cdr-kit/react-ui";
import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";

const CODE = `import { CdrProgress } from "@cdr-kit/react-ui";

<CdrProgress value={64} />
<CdrProgress collected={6} threshold={10} />`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react-ui", "DX primitives", "CdrProgress"],
        title: "<CdrProgress>",
        badges: <Badge tone="primary">DX primitive</Badge>,
        lede: <>Determinate progress bar with a primary→signal gradient fill. Pass a <code>value</code> 0–100, or pass <code>{`{collected, threshold}`}</code> and the component derives it.</>,
        importLine: 'import { CdrProgress } from "@cdr-kit/react-ui"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: (
              <Demo
                preview={
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
                    <CdrProgress value={64} />
                    <CdrProgress collected={6} threshold={10} />
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
                { name: "value", type: "number", description: "0–100 percentage. Takes precedence over collected/threshold." },
                { name: "collected", type: "number", description: "Numerator — used when value isn't provided." },
                { name: "threshold", type: "number", description: "Denominator — used when value isn't provided." },
              ]} />
            ),
          },
        ],
        prev: { href: "/docs/components/cdr-spinner", label: "CdrSpinner" },
        next: { href: "/docs/components/cdr-error", label: "CdrError" },
      }}
    />
  );
}
