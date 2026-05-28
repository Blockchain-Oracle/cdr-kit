import type { ReactNode } from "react";
import { Sidebar } from "@/components/app/sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px circle at 100% -5%, color-mix(in srgb, var(--primary) 7%, transparent), transparent 55%)",
        }}
      />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
