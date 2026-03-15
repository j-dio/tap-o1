"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, History, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { useTransition } from "react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SyncButton } from "@/components/sync-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  displayName: string;
  email: string;
  hasUvec: boolean;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ displayName, email, hasUvec }: SidebarNavProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="bg-primary flex size-8 items-center justify-center rounded-lg">
          <span className="text-primary-foreground text-[9px] font-bold">
            O(1)
          </span>
        </div>
        <span className="text-sm font-semibold">TapO(1)</span>
      </div>

      <Separator />

      {/* Nav links — scrollable when content overflows */}
      <nav className="min-h-0 flex-1 overflow-y-auto space-y-1 px-3 py-3" aria-label="Dashboard">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "skeu-nav-active text-foreground"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* UVEC status — pinned above profile */}
      {!hasUvec && (
        <div className="shrink-0 px-3 pb-2">
          <Link
            href="/onboarding"
            className="text-muted-foreground hover:border-primary hover:text-foreground block rounded-md border border-dashed px-3 py-2 text-xs transition-colors"
          >
            Connect UVEC to sync tasks
          </Link>
        </div>
      )}

      <Separator />

      {/* User info + actions — always visible at bottom */}
      <div className="shrink-0 px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="text-muted-foreground truncate text-xs">{email}</p>
          </div>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <SyncButton />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSignOut}
              disabled={isPending}
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
