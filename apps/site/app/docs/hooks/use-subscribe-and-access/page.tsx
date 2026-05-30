import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";

const SIG = `function useSubscribeAndAccess(
  uuid: number,
  subscriptionCondition?: Hex,
): {
  run: (p: {
    periods: bigint;
    maxPricePerPeriod: bigint;
    value: bigint;
    accessAuxData?: Hex;
  }) => Promise<Uint8Array>;
  status: "idle" | "paying" | "collecting-partials" | "ready" | "error";
  data?: Uint8Array;
};`;

export default function UseSubscribeAndAccessPage() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react", "Hooks", "useSubscribeAndAccess"],
        title: "useSubscribeAndAccess",
        badges: <Badge tone="primary">hook</Badge>,
        lede: <>The full 2-step flow — pay (real subscribe tx) then access (threshold read). Five status values; design the &quot;paying&quot; and &quot;collecting-partials&quot; states legibly.</>,
        importLine: 'import { useSubscribeAndAccess } from "@cdr-kit/react"',
        sections: [
          { id: "signature", title: "Signature", content: <div className="win doc-code"><div className="win-bar"><span className="lights"><i /><i /><i /></span><span className="win-title">type</span></div><div className="code"><pre><code>{SIG}</code></pre></div></div> },
        ],
        prev: { href: "/docs/hooks/use-access-vault", label: "useAccessVault" },
        next: { href: "/docs/hooks/use-create-vault", label: "useCreateVault" },
      }}
    />
  );
}
