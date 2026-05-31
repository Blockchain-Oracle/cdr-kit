import { Badge } from "@/components/primitives/badge";
import { DocPage } from "@/components/docs/doc-page";
import { CodePanel } from "@/components/docs/code-panel";

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
          { id: "signature", title: "Signature", content: <CodePanel title="type" code={SIG} language="ts" /> },
        ],
        prev: { href: "/docs/hooks/use-access-vault", label: "useAccessVault" },
        next: { href: "/docs/hooks/use-create-vault", label: "useCreateVault" },
      }}
    />
  );
}
