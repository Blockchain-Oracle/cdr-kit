"use client";

import { useState } from "react";
import { CopyButton } from "../primitives/copy-button";

type Pm = "npm" | "pnpm" | "bun";

const COMMANDS: Record<Pm, string> = {
  npm: "npm i @cdr-kit/react @cdr-kit/core wagmi viem",
  pnpm: "pnpm add @cdr-kit/react @cdr-kit/core wagmi viem",
  bun: "bun add @cdr-kit/react @cdr-kit/core wagmi viem",
};

export function InstallTabs() {
  const [pm, setPm] = useState<Pm>("pnpm");
  return (
    <>
      <div className="qs-tabbar">
        <div className="tabs" role="tablist">
          {(Object.keys(COMMANDS) as Pm[]).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={pm === k}
              className="tab"
              onClick={() => setPm(k)}
            >
              {k}
            </button>
          ))}
        </div>
        <CopyButton value={COMMANDS[pm]} />
      </div>
      <div className="code">
        <pre>
          <code>
            <span className="tok-punc">$</span> {COMMANDS[pm].split(" ")[0]}{" "}
            {COMMANDS[pm].split(" ")[1]} <span className="tok-str">@cdr-kit/react @cdr-kit/core</span>{" "}
            wagmi viem
          </code>
        </pre>
      </div>
    </>
  );
}
