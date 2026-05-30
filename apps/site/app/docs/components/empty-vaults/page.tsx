import { DocPage } from "@/components/docs/doc-page";

export default function EmptyVaultsPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Components", "EmptyVaults"],
        title: "EmptyVaults",
        lede: <>Semantic empty-state slot — a <code>div[data-cdr-empty]</code> with a default copy fallback. Style at the consumer level.</>,
        importLine: 'import { EmptyVaults } from "@cdr-kit/react"',
        sections: [
          {
            id: "usage",
            title: "Usage",
            content: (
              <div className="win doc-code">
                <div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">Marketplace.tsx</span></div>
                <div className="code"><pre><code>{`{vaults.length === 0 ? <EmptyVaults>No vaults match your filter.</EmptyVaults> : <VaultGrid />}`}</code></pre></div>
              </div>
            ),
          },
        ],
        prev: { href: "/docs/components/cdr-skeleton", label: "CdrSkeleton" },
        next: { href: "/docs/components/condition-badge", label: "ConditionBadge" },
      }}
    />
  );
}
