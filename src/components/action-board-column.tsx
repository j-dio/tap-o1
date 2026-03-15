"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type {
  TaskWithCourse,
  ActionBoardColumn as ColumnId,
} from "@/types/task";
import { SortableTaskCard } from "@/components/sortable-task-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ListCheck,
  ListTodo,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const columnIcons: Record<ColumnId, LucideIcon> = {
  todo: ListTodo,
  in_progress: Clock,
  done: CheckCircle2,
};

// ---- Per-column empty state ------------------------------------------------

interface ColumnEmptyStateProps {
  id: ColumnId;
  todoWindowDays?: number;
}

function ColumnEmptyState({ id, todoWindowDays }: ColumnEmptyStateProps) {
  const config = {
    todo: {
      icon: ListTodo,
      title: "All caught up!",
      description: `No tasks due in the next ${todoWindowDays ?? 7} days.`,
    },
    in_progress: {
      icon: Clock,
      title: "Nothing in progress",
      description: "Drag tasks here or mark one as in progress.",
    },
    done: {
      icon: ListCheck,
      title: "Nothing done yet",
      description: "Drag tasks here or mark them as done.",
    },
  }[id];
  const Icon = config.icon;

  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
      <Icon className="size-6 opacity-40" />
      <p className="text-xs font-medium">{config.title}</p>
      <p className="text-xs opacity-70">{config.description}</p>
    </div>
  );
}

interface ActionBoardColumnProps {
  id: ColumnId;
  title: string;
  tasks: TaskWithCourse[];
  accentClass: string;
  /** Show More callback — provided when more tasks exist beyond the current window. */
  onShowMore?: () => void;
  /** Show Less callback — provided when the window is larger than the minimum. */
  onShowLess?: () => void;
  /** Label for the Show More button (e.g. "Next 14d" or "Show 5 more"). */
  showMoreLabel?: string;
  /** Current To Do window in days (used for the empty state description). */
  todoWindowDays?: number;
  /** Callback to dismiss all tasks in this column (used for Done column). */
  onDismissAll?: () => void;
  /** Whether the dismiss-all mutation is currently pending. */
  isDismissAllPending?: boolean;
}

export function ActionBoardColumn({
  id,
  title,
  tasks,
  accentClass,
  onShowMore,
  onShowLess,
  showMoreLabel,
  todoWindowDays,
  onDismissAll,
  isDismissAllPending,
}: ActionBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const Icon = columnIcons[id];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "skeu-column flex w-70 shrink-0 flex-col rounded-2xl p-3 transition-all duration-200 lg:min-w-60 lg:flex-1",
        isOver && "skeu-column-over",
      )}
    >
      {/* Column header */}
      <div className="mb-3 flex min-h-8 items-center gap-2">
        <Icon className={cn("size-4", accentClass)} />
        <span className="text-sm font-semibold">{title}</span>
        {id === "done" && onDismissAll && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs"
            disabled={tasks.length === 0 || isDismissAllPending}
            onClick={onDismissAll}
          >
            Dismiss all
          </Button>
        )}
        <span
          className={cn(
            "bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium",
            !(id === "done" && onDismissAll) && "ml-auto",
          )}
        >
          {tasks.length}
        </span>
      </div>

      {/* Column body */}
      <ScrollArea className="flex-1">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-25 space-y-3">
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
              <ColumnEmptyState id={id} todoWindowDays={todoWindowDays} />
            )}
          </div>
        </SortableContext>

        {(onShowLess || onShowMore) && (
          <div className="mt-3 flex gap-2 pb-1">
            {onShowLess && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 flex-1 justify-center rounded-md px-3 text-sm"
                onClick={onShowLess}
              >
                <ChevronUp className="mr-1.5 size-3.5" />
                Show less
              </Button>
            )}
            {onShowMore && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 flex-1 justify-center rounded-md px-3 text-sm"
                onClick={onShowMore}
              >
                <ChevronDown className="mr-1.5 size-3.5" />
                {showMoreLabel ?? "Show more"}
              </Button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
