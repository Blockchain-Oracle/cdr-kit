"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, PlusCircle, Boxes, Wallet, BookText } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useIsLive } from "@/lib/use-vaults";

const items = [
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Create vault", href: "/create", icon: PlusCircle },
  { label: "Seller", href: "/seller", icon: Boxes },
  { label: "Buyer", href: "/buyer", icon: Wallet },
];

export function AppSidebar() {
  const pathname = usePathname();
  const isLive = useIsLive();
  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
            <span className="h-2 w-2 rounded-[2px] bg-primary" />
          </span>
          <span className="font-mono text-sm font-medium tracking-tight">cdr-kit</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <SidebarMenuItem key={it.href}>
                    <SidebarMenuButton isActive={active} tooltip={it.label} render={<Link href={it.href} />}>
                      <it.icon />
                      <span>{it.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Docs" render={<Link href="/docs" />}>
              <BookText />
              <span>Docs</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="rounded-lg border border-sidebar-border bg-card/50 px-3 py-2.5 group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-muted-foreground">Network</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            Story Aeneid
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{isLive ? "live" : "mock"}</span>
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
