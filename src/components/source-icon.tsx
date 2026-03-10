import { GraduationCap, Calendar, UserPen } from "lucide-react";
import type { TaskSource } from "@/types/task";
import { cn } from "@/lib/utils";

interface SourceIconProps {
  source: TaskSource;
  className?: string;
}

const sourceIcons: Record<TaskSource, typeof GraduationCap> = {
  gclassroom: GraduationCap,
  uvec: Calendar,
  custom: UserPen,
};

export function SourceIcon({ source, className }: SourceIconProps) {
  const Icon = sourceIcons[source];
  return (
    <Icon
      className={cn("text-muted-foreground size-3.5 shrink-0", className)}
    />
  );
}
