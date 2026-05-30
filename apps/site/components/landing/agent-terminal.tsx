"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/lib/use-in-view";

type LineKind = "cmd" | "dim" | "tool" | "ok" | "acc" | "spacer" | "done";

interface Line {
  kind: LineKind;
  /** Final HTML; only inner span markup permitted (already-trusted authoring). */
  html: string;
  /** Delay after this line types out before the next starts (ms). */
  delay: number;
}

const SCRIPT: Line[] = [
  { kind: "cmd", html: '<span class="pmt">›</span> <span class="cmd">pnpm --filter cdr-kit-example-vercel-ai-chatbot start</span>', delay: 60 },
  { kind: "dim", html: "agent online · model=claude · wallet=0x9f…a3c1 · chain=aeneid", delay: 360 },
  { kind: "tool", html: '⚙ <span class="tool">cdr_discover_vaults</span> { intent: "trading signal" }', delay: 520 },
  { kind: "dim", html: "  → 3 vaults · matched uuid 4200  (Subscription · 5 $IP/30d)", delay: 360 },
  { kind: "tool", html: '⚙ <span class="tool">cdr_subscribe_and_access</span> { uuid: 4200, periods: 1 }', delay: 520 },
  { kind: "dim", html: "  → tx 0x4e…b1 confirmed · paid 5 $IP · collecting key shares…", delay: 520 },
  { kind: "ok", html: "  ✓ threshold met (7/10 shares) · payload decrypted locally", delay: 420 },
  { kind: "acc", html: '  signal: { "BUY": "ETH/USD", confidence: 0.86 }', delay: 380 },
  { kind: "spacer", html: "&nbsp;", delay: 80 },
  { kind: "cmd", html: '<span class="pmt">›</span> <span class="cmd">Decision:</span> <span class="ok">BUY ETH/USD</span> — confidence 0.86, acting on signal.', delay: 60 },
  { kind: "done", html: '<span class="ok">●</span> <span class="dim">loop complete · no human in the loop · 28.4s</span>', delay: 0 },
];

const TYPE_MS = 13;
const RESTART_AFTER_MS = 5200;

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

export function AgentTerminal() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  const [lines, setLines] = useState<{ kind: LineKind; html: string; partialPlain?: string }[]>([]);

  useEffect(() => {
    if (!inView) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        setLines([]);
        for (let i = 0; i < SCRIPT.length; i++) {
          if (cancelled) return;
          const item = SCRIPT[i]!;
          if (item.kind === "spacer") {
            setLines((prev) => [...prev, { kind: item.kind, html: item.html }]);
            await wait(item.delay);
            continue;
          }
          if (reduce) {
            setLines((prev) => [...prev, { kind: item.kind, html: item.html }]);
          } else {
            const plain = stripTags(item.html);
            setLines((prev) => [...prev, { kind: item.kind, html: "", partialPlain: "" }]);
            for (let n = 1; n <= plain.length; n++) {
              if (cancelled) return;
              await wait(TYPE_MS);
              setLines((prev) => {
                const next = prev.slice();
                next[next.length - 1] = { kind: item.kind, html: "", partialPlain: plain.slice(0, n) };
                return next;
              });
            }
            // After typing, swap to the real HTML so colors/spans render.
            setLines((prev) => {
              const next = prev.slice();
              next[next.length - 1] = { kind: item.kind, html: item.html };
              return next;
            });
          }
          await wait(item.delay);
        }
        await wait(RESTART_AFTER_MS);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [inView]);

  return (
    <div className="term" ref={ref}>
      <div className="term-bar">
        <span className="lights">
          <i />
          <i />
          <i />
        </span>
        <span className="tt">cdr-kit-example-vercel-ai-chatbot</span>
        <span className="runtag">
          <span className="dot" />
          live · aeneid
        </span>
      </div>
      <div className="term-body">
        {lines.map((line, i) => {
          const isLast = i === lines.length - 1;
          if (line.partialPlain !== undefined) {
            return (
              <div key={i} className="term-line">
                {line.partialPlain}
                {isLast && <span className="term-cursor" />}
              </div>
            );
          }
          return (
            <div
              key={i}
              className="term-line"
              dangerouslySetInnerHTML={{
                __html: line.html + (isLast ? '<span class="term-cursor"></span>' : ""),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
