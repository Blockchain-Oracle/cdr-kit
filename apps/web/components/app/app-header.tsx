"use client";

import { Wallet, Check } from "lucide-react";
import { useCdrWallet } from "@cdr-kit/react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

const LIVE = Boolean(process.env.NEXT_PUBLIC_CDR_API_URL);
const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export function AppHeader({ title }: { title: string }) {
  const { address, isConnected, isConnecting, connect, disconnect } = useCdrWallet();
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground" />
        <h1 className="text-sm font-medium text-muted-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card/50 px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          Aeneid · {LIVE ? "live" : "mock"}
        </span>
        {isConnected ? (
          <Button size="sm" variant="outline" className="gap-2 font-mono" onClick={disconnect}>
            <Check className="h-4 w-4 text-signal" />
            {short(address)}
          </Button>
        ) : (
          <Button size="sm" className="gap-2" onClick={connect} disabled={isConnecting}>
            <Wallet className="h-4 w-4" />
            {isConnecting ? "Connecting…" : "Connect wallet"}
          </Button>
        )}
      </div>
    </header>
  );
}
