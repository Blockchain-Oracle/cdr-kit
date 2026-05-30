import { Check, CreditCard, KeyRound, AlertCircle, Boxes } from "./icons";

export type AccessStatus = "idle" | "paying" | "collecting-partials" | "ready" | "error";

export interface AccessStepperProps {
  status: AccessStatus;
  /** When provided, drives the determinate partial-collection bar in the active state. */
  progress?: { collected: number; threshold: number };
  /** Include the "Subscribe & pay" step (default true for subscription-gated vaults). */
  withPay?: boolean;
}

type StepState = "pending" | "active" | "done" | "errored";

interface Step {
  key: string;
  label: string;
  sub?: string;
  state: StepState;
  partials?: { collected: number; threshold: number };
}

function derive(status: AccessStatus, withPay: boolean, progress?: AccessStepperProps["progress"]): Step[] {
  const errored = status === "error";
  // stage order: pay (optional) → collect → decrypt
  const stages = [withPay ? "pay" : null, "collect", "decrypt"].filter(Boolean) as ("pay" | "collect" | "decrypt")[];
  const activeIdx = (() => {
    if (status === "paying" && withPay) return 0;
    if (status === "collecting-partials") return stages.indexOf("collect");
    if (status === "ready") return stages.length;
    return -1;
  })();
  return stages.map((s, i) => {
    let state: StepState = "pending";
    if (errored && i === Math.max(activeIdx, 0)) state = "errored";
    else if (i < activeIdx) state = "done";
    else if (i === activeIdx) state = "active";
    const labelMap = {
      pay: { label: "Subscribe & pay", sub: "subscribe(uuid, periods, price)" },
      collect: { label: "Collect validator partials", sub: "threshold collection" },
      decrypt: { label: "Decrypt locally", sub: "key shares → plaintext" },
    };
    return {
      key: s,
      label: labelMap[s].label,
      sub: labelMap[s].sub,
      state,
      partials: s === "collect" && state === "active" && progress ? progress : undefined,
    };
  });
}

function NodeIcon({ step }: { step: Step }) {
  if (step.state === "done") return <Check />;
  if (step.state === "errored") return <AlertCircle />;
  if (step.key === "pay") return <CreditCard />;
  if (step.key === "collect") return <Boxes />;
  return <KeyRound />;
}

export function AccessStepper({ status, progress, withPay = true }: AccessStepperProps) {
  const steps = derive(status, withPay, progress);
  return (
    <ol className="cdr-ui-stepper" data-cdr-ui="">
      {steps.map((step, i) => (
        <li key={step.key} className={["cdr-ui-step", step.state].join(" ")}>
          {i < steps.length - 1 && <span className="conn" />}
          <span className="node"><NodeIcon step={step} /></span>
          <div>
            <div className="label">{step.label}</div>
            <div className="sub">{step.sub}</div>
            {step.partials && (
              <div className="cdr-ui-partials">
                <div className="bars">
                  {Array.from({ length: step.partials.threshold }).map((_, n) => (
                    <i key={n} className={n < step.partials!.collected ? "on" : undefined} />
                  ))}
                </div>
                <div className="pmeta">
                  collected {step.partials.collected} / {step.partials.threshold}
                </div>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
