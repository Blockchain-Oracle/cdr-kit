import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/landing/hero";

const nav = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Docs", href: "/docs" },
  { label: "Agent kit", href: "#agent" },
  { label: "GitHub", href: "https://github.com" },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
              <span className="h-2 w-2 rounded-[2px] bg-primary" />
            </span>
            <span className="font-mono text-sm font-medium tracking-tight">cdr-kit</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <Button size="sm" variant="outline" className="border-border bg-card/40">
            Connect wallet
          </Button>
        </div>
      </header>
      <Hero />
    </>
  );
}
