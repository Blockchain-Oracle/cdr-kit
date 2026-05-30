import type { ReactNode } from "react";
import { ExternalLink } from "./icons";

export interface ExplorerLinkProps {
  href: string;
  children?: ReactNode;
}

/** Mono primary-colored link with external-link icon. */
export function ExplorerLink({ href, children = "view" }: ExplorerLinkProps) {
  return (
    <a className="cdr-ui-xlink" data-cdr-ui="" href={href} target="_blank" rel="noopener noreferrer">
      {children} <ExternalLink />
    </a>
  );
}
