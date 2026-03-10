"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true;
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="bg-warning text-warning-foreground fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium shadow-sm"
    >
      <WifiOff className="size-4" />
      <span>You are offline — showing cached data</span>
    </div>
  );
}
