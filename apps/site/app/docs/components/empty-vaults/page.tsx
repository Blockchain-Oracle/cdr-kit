import { DocPage } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";
import { EmptyVaultsDemo } from "@/components/docs/demos/headless-demos";

const CODE = `import { EmptyVaults } from "@cdr-kit/react";

<EmptyVaults />
<EmptyVaults>No vaults match your filter.</EmptyVaults>

// typical use:
{vaults.length === 0
  ? <EmptyVaults>No vaults match your filter.</EmptyVaults>
  : <VaultGrid vaults={vaults} />}`;

export default function EmptyVaultsPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Components", "EmptyVaults"],
        title: "<EmptyVaults>",
        lede: <>Semantic empty-state slot — a <code>div[data-cdr-empty]</code> with a default copy fallback. Style at the consumer level.</>,
        importLine: 'import { EmptyVaults } from "@cdr-kit/react"',
        sections: [
          { id: "preview", title: "Live preview", content: <Demo preview={<EmptyVaultsDemo />} code={CODE} /> },
        ],
        prev: { href: "/docs/components/cdr-skeleton", label: "CdrSkeleton" },
        next: { href: "/docs/components/condition-badge", label: "ConditionBadge" },
      }}
    />
  );
}
