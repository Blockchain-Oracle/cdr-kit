"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, PlusCircle, Boxes, Wallet, BookText } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Create vault", href: "/create", icon: PlusCircle },
  { label: "Seller", href: "/seller", icon: Boxes },
  { label: "Buyer", href: "/buyer", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar/50 px-3 py-5 backdrop-blur lg:flex">
      <Link href="/" className="flex items-center gap-2 px-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
          <span className="h-2 w-2 rounded-[2px] bg-primary" />
        </span>
        <span className="font-mono text-sm font-medium tracking-tight">cdr-kit</span>
      </Link>

      <nav className="mt-7 flex flex-col gap-1">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/12 text-foreground ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-primary" : "")} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <Link
          href="/docs"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <BookText className="h-4 w-4" />
          Docs
        </Link>
        <div className="mt-2 rounded-lg border border-border/70 bg-card/50 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">Network</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            Story Aeneid
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">mock</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
