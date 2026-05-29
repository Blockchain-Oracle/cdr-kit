"use client";

import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground" />
        <h1 className="text-sm font-medium text-muted-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card/50 px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          Aeneid · mock
        </span>
        <Button size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect wallet
        </Button>
      </div>
    </header>
  );
}
