import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";
import { CdrInspectorDemo } from "@/components/docs/demos/headless-demos";

const CODE = `import { CdrInspector } from "@cdr-kit/react";

export function App() {
  return (
    <CdrProvider mockKit={createMockCdrKit()}>
      {process.env.NODE_ENV !== "production" && <CdrInspector />}
      {/* …rest of app */}
    </CdrProvider>
  );
}`;

export default function CdrInspectorPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Components", "CdrInspector"],
        title: "<CdrInspector>",
        badges: <Badge>dev tool</Badge>,
        lede: (
          <>
            Drop-in debug strip showing how the kit is wired (<code>mock</code> vs <code>live</code>, WASM ready, API
            URL). Keep it in dev builds; remove or guard for production.
          </>
        ),
        importLine: 'import { CdrInspector } from "@cdr-kit/react"',
        sections: [
          { id: "preview", title: "Live preview", content: <Demo preview={<CdrInspectorDemo />} code={CODE} /> },
        ],
        prev: { href: "/docs/components/vault", label: "Vault compound" },
        next: { href: "/docs/components/cdr-skeleton", label: "CdrSkeleton" },
      }}
    />
  );
}
