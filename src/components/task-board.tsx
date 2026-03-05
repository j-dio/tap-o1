"use client";

import type { TaskWithCourse, TaskDisplayStatus } from "@/types/task";
import { groupTasksByUrgency, cn, type SortOption } from "@/lib/utils";
import { TaskCard } from "@/components/task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TaskBoardProps {
  tasks: TaskWithCourse[];
  statusFilter?: TaskDisplayStatus;
  sort?: SortOption;
  onLoadMoreOverdue?: () => void;
  onLoadMoreLater?: () => void;
}

interface ColumnDef {
  key: string;
  label: string;
  icon: LucideIcon;
  accentClass: string;
}

const columns: ColumnDef[] = [
  {
    key: "overdue",
    label: "Overdue",
    icon: AlertTriangle,
    accentClass: "text-destructive",
  },
  {
    key: "today",
    label: "Due Today",
    icon: Clock,
    accentClass: "text-warning",
  },
  {
    key: "thisWeek",
    label: "This Week",
    icon: CalendarDays,
    accentClass: "text-info",
  },
  {
    key: "later",
    label: "Later",
    icon: CalendarRange,
    accentClass: "text-muted-foreground",
  },
];

export function TaskBoard({
  tasks,
  statusFilter,
  sort,
  onLoadMoreOverdue,
  onLoadMoreLater,
}: TaskBoardProps) {
  const buckets = groupTasksByUrgency(tasks, { statusFilter, sort });

  const loadMoreMap: Record<string, (() => void) | undefined> = {
    overdue: onLoadMoreOverdue,
    later: onLoadMoreLater,
  };

  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0">
      {columns.map((col) => {
        const items = buckets[col.key as keyof typeof buckets] ?? [];
        const loadMore = loadMoreMap[col.key];
        return (
          <div
            key={col.key}
            className="flex w-70 shrink-0 flex-col lg:min-w-60 lg:flex-1"
          >
            {/* Column header */}
            <div className="mb-3 flex items-center gap-2">
              <col.icon className={cn("size-4", col.accentClass)} />
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="bg-muted text-muted-foreground ml-auto rounded-full px-2 py-0.5 text-xs font-medium">
                {items.length}
              </span>
            </div>

            {/* Column body */}
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {items.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {items.length === 0 && (
                  <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-xs">
                    No tasks
                  </div>
                )}
                {loadMore && items.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={loadMore}
                  >
                    Show older
                  </Button>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
