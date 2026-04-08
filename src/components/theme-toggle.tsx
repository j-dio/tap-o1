"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

// ── Minimal pub/sub so React re-renders when applyTheme fires ──────────────
const themeListeners = new Set<() => void>();

function subscribeToTheme(callback: () => void) {
  themeListeners.add(callback);
  return () => {
    themeListeners.delete(callback);
  };
}

// Client snapshot: reads localStorage first, falls back to the pre-hydration
// class set by the blocking script in layout.tsx.
function getThemeSnapshot(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// Server snapshot: always "light" so SSR HTML is deterministic.
function getServerTheme(): Theme {
  return "light";
}

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem("theme", theme);
  themeListeners.forEach((l) => l());
}

interface ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel }: ThemeToggleProps) {
  // useSyncExternalStore gives React the server/client split it needs:
  // SSR uses getServerTheme ("light"), client uses getThemeSnapshot (real value).
  // React reconciles the difference without a hydration error.
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerTheme,
  );

  function toggle() {
    applyTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon-sm"}
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={showLabel ? "gap-1.5" : undefined}
    >
      {theme === "dark" ? (
        <Sun className="size-4 shrink-0" />
      ) : (
        <Moon className="size-4 shrink-0" />
      )}
      {showLabel && <span>Theme</span>}
    </Button>
  );
}
