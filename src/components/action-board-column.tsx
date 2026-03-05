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
import { CheckCircle2, ChevronDown, Clock, ListTodo } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const columnIcons: Record<ColumnId, LucideIcon> = {
  todo: ListTodo,
  in_progress: Clock,
  done: CheckCircle2,
};

interface ActionBoardColumnProps {
  id: ColumnId;
  title: string;
  tasks: TaskWithCourse[];
  accentClass: string;
  /** Show More callback — only provided for the To Do column. */
  onShowMore?: () => void;
  /** Current To Do window in days (used for button label). */
  todoWindowDays?: number;
}

export function ActionBoardColumn({
  id,
  title,
  tasks,
  accentClass,
  onShowMore,
  todoWindowDays,
}: ActionBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const Icon = columnIcons[id];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-70 shrink-0 flex-col transition-colors lg:min-w-60 lg:flex-1",
        isOver && "bg-accent/30 rounded-lg",
      )}
    >
      {/* Column header */}
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn("size-4", accentClass)} />
        <span className="text-sm font-semibold">{title}</span>
        <span className="bg-muted text-muted-foreground ml-auto rounded-full px-2 py-0.5 text-xs font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Column body */}
      <ScrollArea className="flex-1">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-25 space-y-2">
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
              <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-xs">
                {id === "done" ? "No completed tasks" : "Drop tasks here"}
              </div>
            )}
          </div>
        </SortableContext>

        {onShowMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-xs"
            onClick={onShowMore}
          >
            <ChevronDown className="mr-1 size-3" />
            Show tasks due in next{" "}
            {todoWindowDays !== undefined ? todoWindowDays + 7 : 14} days
          </Button>
        )}
      </ScrollArea>
    </div>
  );
}
