"use client";

import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FocusModeToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function FocusModeToggle({ enabled, onToggle }: FocusModeToggleProps) {
  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      aria-label={enabled ? "Disable focus mode" : "Enable focus mode"}
      className={cn(
        "gap-2",
        enabled && "bg-warning text-warning-foreground hover:bg-warning/90",
      )}
    >
      <Target className="size-4" />
      <span className="hidden sm:inline">Focus</span>
    </Button>
  );
}
