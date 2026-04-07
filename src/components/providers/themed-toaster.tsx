"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

type Theme = "light" | "dark";

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage unavailable (SSR guard)
  }
  return "light";
}

export function ThemedToaster() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    // Sync on mount in case the blocking script already toggled .dark
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );

    // Watch future theme toggles
    const observer = new MutationObserver(() => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light",
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      closeButton
      visibleToasts={3}
    />
  );
}
