"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useSync,
  isSyncOnCooldown,
  cooldownRemainingMs,
  getLastSyncAt,
} from "@/hooks/use-sync";
import { cn } from "@/lib/utils";

interface SyncButtonProps {
  className?: string;
}

function formatCooldown(ms: number): string {
  const mins = Math.ceil(ms / 60_000);
  return `${mins}m`;
}

export function SyncButton({ className }: SyncButtonProps) {
  const { mutate: sync, isPending, error, data } = useSync();
  const [cooldown, setCooldown] = useState(false);
  const [remaining, setRemaining] = useState(0);

  // Poll cooldown state every second
  useEffect(() => {
    const id = setInterval(() => {
      const onCooldown = isSyncOnCooldown();
      setCooldown(onCooldown);
      setRemaining(onCooldown ? cooldownRemainingMs() : 0);
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  const disabled = isPending || cooldown;

  const hasWarnings = data && data.errors.length > 0;
  const title = error?.message
    ? `Sync failed: ${error.message}`
    : hasWarnings
      ? "Synced with warnings"
      : cooldown
        ? `Sync available in ${formatCooldown(remaining)}`
        : "Sync tasks";

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => sync()}
        disabled={disabled}
        className={className}
        aria-label={title}
        title={title}
      >
        <RefreshCw
          className={cn(
            "size-4",
            isPending && "animate-spin",
            error && "text-destructive",
          )}
        />
      </Button>
      {error && (
        <span className="text-destructive max-w-xs truncate text-xs">
          {error.message}
        </span>
      )}
      {!error && cooldown && getLastSyncAt() > 0 && (
        <span className="text-muted-foreground text-xs">
          {formatCooldown(remaining)}
        </span>
      )}
    </div>
  );
}
