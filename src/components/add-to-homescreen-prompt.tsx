"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Download, Share, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const LS_KEY = "a2hs-dismissed";

/* ─── Platform detection (runs once on module load) ─── */

function getIsIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
  );
}

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true)
  );
}

/* ─── beforeinstallprompt event store ─── */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const fn of listeners) fn();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

function subscribePrompt(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getPromptSnapshot(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

function getPromptServerSnapshot(): BeforeInstallPromptEvent | null {
  return null;
}

/* ─── Component ─── */

export function AddToHomescreenPrompt() {
  const prompt = useSyncExternalStore(
    subscribePrompt,
    getPromptSnapshot,
    getPromptServerSnapshot,
  );

  const isIos = getIsIos();
  const isStandalone = getIsStandalone();

  // Determine if we've already dismissed
  const wasDismissed =
    typeof window !== "undefined" && localStorage.getItem(LS_KEY) === "1";

  const showAndroid = !!prompt && !isStandalone && !wasDismissed;
  const showIos = isIos && !isStandalone && !wasDismissed;
  const visible = showAndroid || showIos;

  const handleDismiss = useCallback(() => {
    localStorage.setItem(LS_KEY, "1");
    deferredPrompt = null;
    notifyListeners();
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      localStorage.setItem(LS_KEY, "1");
    }
    deferredPrompt = null;
    notifyListeners();
  }, []);

  if (!visible) return null;

  /* ── iOS: Sheet with instructions ── */
  if (showIos) {
    return (
      <Sheet open onOpenChange={(open) => !open && handleDismiss()}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8">
          <SheetHeader className="items-center text-center">
            <div className="bg-primary/10 mx-auto flex size-12 items-center justify-center rounded-full">
              <Download className="text-primary size-6" />
            </div>
            <SheetTitle>Add to Home Screen</SheetTitle>
            <SheetDescription>
              Install Task Aggregator for a faster, app-like experience.
            </SheetDescription>
          </SheetHeader>

          <ol className="text-muted-foreground mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                1
              </span>
              <span>
                Tap the{" "}
                <Share className="mx-0.5 mb-0.5 inline size-4 align-text-bottom" />{" "}
                <strong>Share</strong> button in Safari&apos;s toolbar
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                2
              </span>
              <span>
                Scroll down and tap{" "}
                <Plus className="mx-0.5 mb-0.5 inline size-4 align-text-bottom" />{" "}
                <strong>Add to Home Screen</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                3
              </span>
              <span>
                Tap <strong>Add</strong> to confirm
              </span>
            </li>
          </ol>

          <Button className="mt-6 w-full" onClick={handleDismiss}>
            Got it
          </Button>
        </SheetContent>
      </Sheet>
    );
  }

  /* ── Android/Chrome: Install banner ── */
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm">
      <div className="bg-card flex items-start gap-3 rounded-lg border p-4 shadow-lg">
        <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Download className="text-primary size-5" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">Install Task Aggregator</p>
          <p className="text-muted-foreground text-xs">
            Add to your home screen for a faster, app-like experience.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleInstall}>
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
