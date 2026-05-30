import { Badge } from "@/components/primitives/badge";
import { DocPage, PropsTable } from "@/components/docs/doc-page";
import { Demo } from "@/components/docs/demo";
import { AccessStepperDemo } from "@/components/gallery/access-stepper-demo";

const CODE = `import { AccessStepper } from "@cdr-kit/react-ui";
import { useAccessVault } from "@cdr-kit/react";

function Stepper({ uuid }) {
  const { status, progress } = useAccessVault(uuid);
  return <AccessStepper status={status} progress={progress} withPay />;
}`;

export default function Page() {
  return (
    <DocPage
      data={{
        breadcrumb: ["@cdr-kit/react-ui", "Components", "AccessStepper"],
        title: "<AccessStepper>",
        badges: <Badge tone="primary">styled</Badge>,
        lede: <>Designed wait-state UI for the 2-step pay→access flow. Derives step state from <code>useAccessVault</code>&apos;s <code>status</code> + an optional <code>{`{collected, threshold}`}</code> for the determinate partial-collection bar.</>,
        importLine: 'import { AccessStepper } from "@cdr-kit/react-ui"',
        sections: [
          {
            id: "preview",
            title: "Live preview",
            content: <Demo preview={<AccessStepperDemo />} code={CODE} badge={<Badge>phase selector</Badge>} />,
          },
          {
            id: "props",
            title: "Props",
            content: (
              <PropsTable rows={[
                { name: "status", type: '"idle" | "paying" | "collecting-partials" | "ready" | "error"', required: true, description: "Drives which step is active / done / errored." },
                { name: "progress", type: "{ collected: number; threshold: number }", description: "When provided, drives the determinate partials bar in the collecting step." },
                { name: "withPay", type: "boolean", defaultValue: "true", description: "Include the leading Subscribe & pay step (for subscription-gated vaults)." },
              ]} />
            ),
          },
        ],
        prev: { href: "/docs/components/condition-badge", label: "ConditionBadge" },
        next: { href: "/docs/components/subscribe-button", label: "SubscribeButton" },
      }}
    />
  );
}
