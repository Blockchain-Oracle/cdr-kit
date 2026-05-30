import { DocPage, PropsTable } from "@/components/docs/doc-page";

export default function CdrSkeletonPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Components", "CdrSkeleton"],
        title: "CdrSkeleton",
        lede: <>Default placeholder rendered by <code>&lt;VaultGate&gt;</code> / <code>&lt;Vault.Loading&gt;</code> when no custom <code>loading</code> slot is supplied. Themeable via <code>--cdr-skeleton</code>.</>,
        importLine: 'import { CdrSkeleton } from "@cdr-kit/react"',
        sections: [
          { id: "props", title: "Props", content: <PropsTable rows={[{ name: "lines", type: "number", defaultValue: "3", description: "Number of bar rows to render." }]} /> },
        ],
        prev: { href: "/docs/components/cdr-inspector", label: "CdrInspector" },
        next: { href: "/docs/components/empty-vaults", label: "EmptyVaults" },
      }}
    />
  );
}
