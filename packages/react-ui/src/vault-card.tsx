"use client";

import { useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { ConditionBadge, type ConditionKind } from "./condition-badge";

export interface VaultCardProps {
  uuid: number;
  condition: ConditionKind;
  title: string;
  description: string;
  dataType?: string;
  creatorName?: string;
  price?: ReactNode;
  href?: string;
  onClick?: () => void;
}

/** Marketplace card with a CSS pointer-tracking spotlight on hover. */
export function VaultCard({ uuid, condition, title, description, dataType, creatorName, price, href, onClick }: VaultCardProps) {
  const ref = useRef<HTMLElement | null>(null);

  function onMove(e: ReactMouseEvent<HTMLElement>) {
    const node = ref.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    node.style.setProperty("--cdr-ui-mx", `${e.clientX - r.left}px`);
    node.style.setProperty("--cdr-ui-my", `${e.clientY - r.top}px`);
  }

  const inner = (
    <>
      <div className="cdr-ui-vcard-top">
        <ConditionBadge kind={condition} />
        <span className="uid">uuid {uuid}</span>
      </div>
      <h3>{title}</h3>
      <p className="vdesc">{description}</p>
      <div className="vmeta">
        {dataType && <span className="chip">{dataType}</span>}
      </div>
      <div className="vfoot">
        <span className="creator">
          <span className="avatar" aria-hidden />
          {creatorName ?? "on-chain"}
        </span>
        {price && <span className="price">{price}</span>}
      </div>
    </>
  );

  const className = "cdr-ui-vcard";
  if (href) {
    return (
      <a
        ref={(node) => {
          ref.current = node;
        }}
        href={href}
        className={className}
        data-cdr-ui=""
        onMouseMove={onMove}
      >
        {inner}
      </a>
    );
  }
  return (
    <div
      ref={(node) => {
        ref.current = node;
      }}
      className={className}
      data-cdr-ui=""
      onMouseMove={onMove}
      onClick={onClick}
    >
      {inner}
    </div>
  );
}
