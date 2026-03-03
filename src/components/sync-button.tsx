"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSync } from "@/hooks/use-sync";
import { cn } from "@/lib/utils";

interface SyncButtonProps {
  className?: string;
}

export function SyncButton({ className }: SyncButtonProps) {
  const { mutate: sync, isPending, error, data } = useSync();

  const hasWarnings = data && data.errors.length > 0 && data.synced > 0;
  const title = error?.message
    ? `Sync failed: ${error.message}`
    : hasWarnings
      ? `Synced ${data.synced} tasks (with warnings)`
      : "Sync tasks";

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => sync()}
        disabled={isPending}
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
    </div>
  );
}
