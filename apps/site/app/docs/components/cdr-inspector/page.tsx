import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

export default function CdrInspectorPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Components", "CdrInspector"],
        title: "CdrInspector",
        badges: <Badge>dev tool</Badge>,
        lede: (
          <>
            Drop-in debug strip showing how the kit is wired (<code>mock</code> vs <code>live</code>, WASM ready, API
            URL). Keep it in dev builds; remove or guard for production.
          </>
        ),
        importLine: 'import { CdrInspector } from "@cdr-kit/react"',
        sections: [
          {
            id: "usage",
            title: "Usage",
            content: (
              <div className="win doc-code">
                <div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">layout.tsx</span></div>
                <div className="code"><pre><code>{`{process.env.NODE_ENV !== "production" && <CdrInspector />}`}</code></pre></div>
              </div>
            ),
          },
        ],
        prev: { href: "/docs/components/vault", label: "Vault compound" },
        next: { href: "/docs/components/cdr-skeleton", label: "CdrSkeleton" },
      }}
    />
  );
}
