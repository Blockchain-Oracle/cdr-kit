"use client";

import { useState } from "react";
import { AccessStepper, type AccessStatus } from "@cdr-kit/react-ui";

const PHASES: AccessStatus[] = ["idle", "paying", "collecting-partials", "ready", "error"];

export function AccessStepperDemo() {
  const [phase, setPhase] = useState<AccessStatus>("collecting-partials");
  return (
    <div>
      <div className="phasectl">
        {PHASES.map((p) => (
          <button key={p} type="button" aria-pressed={phase === p} onClick={() => setPhase(p)}>
            {p}
          </button>
        ))}
      </div>
      <AccessStepper status={phase} progress={{ collected: 6, threshold: 10 }} withPay />
    </div>
  );
}
