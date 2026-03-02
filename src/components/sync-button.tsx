"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSync } from "@/hooks/use-sync";
import { cn } from "@/lib/utils";

interface SyncButtonProps {
  className?: string;
}

export function SyncButton({ className }: SyncButtonProps) {
  const { mutate: sync, isPending, error } = useSync();

  const title = error?.message ? `Sync failed: ${error.message}` : "Sync tasks";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => sync()}
      disabled={isPending}
      className={className}
      aria-label={title}
      title={title}
    >
      <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
    </Button>
  );
}
