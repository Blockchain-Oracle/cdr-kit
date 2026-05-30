import type { ReactNode } from "react";
import { Sidebar } from "@/components/docs/sidebar";
import "./docs.css";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="docs-shell">
      <Sidebar />
      {children}
    </div>
  );
}
