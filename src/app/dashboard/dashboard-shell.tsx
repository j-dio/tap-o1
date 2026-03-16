"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/sidebar-nav";
import { ExportButton } from "@/components/export-button";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardShellProps {
  children: ReactNode;
  displayName: string;
  email: string;
  hasUvec: boolean;
}

export function DashboardShell({
  children,
  displayName,
  email,
  hasUvec,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="skeu-bg flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="skeu-sidebar hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:overflow-hidden">
        <SidebarNav displayName={displayName} email={email} hasUvec={hasUvec} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="skeu-sidebar w-60 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav
            displayName={displayName}
            email={email}
            hasUvec={hasUvec}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="bg-primary flex size-7 items-center justify-center rounded-md">
              <span className="text-primary-foreground text-[9px] font-bold">
                O(1)
              </span>
            </div>
            <span className="text-sm font-semibold">TapO(1)</span>
          </div>
          <div className="ml-auto flex items-center gap-0.5">
            <ThemeToggle />
            <ExportButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
