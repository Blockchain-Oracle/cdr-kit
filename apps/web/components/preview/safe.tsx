"use client";

import React from "react";

interface SafeProps {
  label: string;
  children: React.ReactNode;
}

/** Error-isolated gallery cell: a label bar + the component; on render error, shows a fallback
 *  chip instead of crashing the whole /preview page. Exploration-only. */
export class Safe extends React.Component<SafeProps, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  componentDidCatch() {
    /* swallow — fallback handles it */
  }
  render() {
    return (
      <section className="border-t border-white/10">
        <div className="bg-black px-6 py-2 font-mono text-[11px] text-neutral-400">{this.props.label}</div>
        {this.state.err ? (
          <div className="bg-black px-6 py-12 text-center font-mono text-xs text-amber-400">
            ⚠ needs props/assets to render — inspect this one in the editor
          </div>
        ) : (
          this.props.children
        )}
      </section>
    );
  }
}
