"use client";

import { useEffect, useRef, useState } from "react";
import { LockClosed, LockOpen } from "../icons";

type Phase = "locked" | "open";

const CIPHER = "7b 22 73 69 67 6e 61 6c 22 3a 22 ?? ?? ?? 9f a3 2e c1 04 7d e8 11 b6 ?? ?? ?? 6a 0c";
const PLAIN = '{ "signal": "BUY", "pair": "ETH/USD", "confidence": 0.86, "ttl": "30d" }';
const DECRYPT_GLYPHS = '0123456789abcdef ?{}":,./';
const DECRYPT_FRAMES = 30;
const DECRYPT_MS_PER_FRAME = 36;

// Cycle timing (from app.js): locked 0–1600ms, decrypt at 1600ms, relock at 7200ms, cycle 9.6s.
const DECRYPT_DELAY = 1600;
const RELOCK_DELAY = 7200;
const CYCLE_PERIOD = 9600;

/** The hero vault card whose payload cycles locked → decrypted → relocked on a 9.6s loop.
 *  Starts when the card enters the viewport. Skipped (locked state only) under reduced-motion. */
export function VaultCycle() {
  const [phase, setPhase] = useState<Phase>("locked");
  const [payload, setPayload] = useState(CIPHER);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let started = false;
    const timers: number[] = [];
    let cycleInterval: number | undefined;

    const decryptScramble = () => {
      setPhase("open");
      let frame = 0;
      const iv = window.setInterval(() => {
        frame++;
        const resolved = Math.floor((frame / DECRYPT_FRAMES) * PLAIN.length);
        let out = "";
        for (let i = 0; i < PLAIN.length; i++) {
          const ch = PLAIN[i] ?? "";
          if (i < resolved) {
            out += ch;
          } else if (ch === " ") {
            out += " ";
          } else {
            out += DECRYPT_GLYPHS[Math.floor(Math.random() * DECRYPT_GLYPHS.length)];
          }
        }
        setPayload(out);
        if (frame >= DECRYPT_FRAMES) {
          setPayload(PLAIN);
          window.clearInterval(iv);
        }
      }, DECRYPT_MS_PER_FRAME);
      timers.push(iv);
    };

    const setLocked = () => {
      setPhase("locked");
      setPayload(CIPHER);
    };

    const cycle = () => {
      timers.push(window.setTimeout(decryptScramble, DECRYPT_DELAY));
      timers.push(window.setTimeout(setLocked, RELOCK_DELAY));
    };

    const start = () => {
      if (started) return;
      started = true;
      setLocked();
      cycle();
      cycleInterval = window.setInterval(cycle, CYCLE_PERIOD);
    };

    const node = ref.current;
    if (node && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && start()),
        { threshold: 0.4 },
      );
      io.observe(node);
      timers.push(window.setTimeout(start, 1500));
      return () => {
        io.disconnect();
        timers.forEach((t) => window.clearTimeout(t));
        if (cycleInterval) window.clearInterval(cycleInterval);
      };
    }
    start();
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      if (cycleInterval) window.clearInterval(cycleInterval);
    };
  }, []);

  const statusClass = phase === "locked" ? "vault-status is-locked" : "vault-status is-open";
  const statusText = phase === "locked" ? "condition not met" : "condition satisfied · decrypted";

  return (
    <div className="hero-right reveal">
      <div className="vault-card win">
        <div className="win-bar">
          <span className="lights">
            <i />
            <i />
            <i />
          </span>
          <span className="win-title">{"<VaultGate uuid={4200} />"}</span>
        </div>
        <div className="vault-meta">
          <div className="vault-row">
            <span className="k">vault.uuid</span>
            <span className="v">4200</span>
          </div>
          <div className="vault-row">
            <span className="k">read.condition</span>
            <span className="v" style={{ color: "var(--primary)" }}>
              Subscription
            </span>
          </div>
          <div className="vault-row">
            <span className="k">price.period</span>
            <span className="v">5 $IP / 30d</span>
          </div>
        </div>
        <div className="vault-body">
          <div ref={ref} className={phase === "locked" ? "vault-payload locked" : "vault-payload"}>
            {payload}
          </div>
          <div className="vault-foot">
            <span className={statusClass}>
              {phase === "locked" ? <LockClosed className="ic" /> : <LockOpen className="ic" />}
              <span>{statusText}</span>
            </span>
            <span className="lat">~15s threshold read</span>
          </div>
        </div>
      </div>
      <div className="vault-chip">
        <span className="ck">condition()</span>
        <span style={{ color: "var(--ink-2)" }}>→</span>
        <span>checkReadCondition(uuid, …)</span>
      </div>
    </div>
  );
}
