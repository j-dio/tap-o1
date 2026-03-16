"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { TaskWithCourse } from "@/types/task";
import { getTaskUrgency, cn } from "@/lib/utils";
import { CourseBadge } from "@/components/course-badge";
import { CountdownBadge } from "@/components/countdown-badge";
import { SourceIcon } from "@/components/source-icon";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { useTaskActions } from "@/hooks/use-task-actions";

interface TaskCardProps {
  task: TaskWithCourse;
  isDragging?: boolean;
  compact?: boolean;
}

const urgencyBorder: Record<string, string> = {
  overdue: "border-l-destructive",
  urgent: "border-l-warning",
  soon: "border-l-info",
  upcoming: "border-l-border",
  later: "border-l-border",
  none: "border-l-border",
};

export function TaskCard({ task, isDragging, compact }: TaskCardProps) {
  const [open, setOpen] = useState(false);
  const { setStatus } = useTaskActions();
  const urgency = getTaskUrgency(task.dueDate);

  const handleQuickDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = task.status === "done" ? "pending" : "done";
    setStatus.mutate({ taskId: task.id, status: newStatus });
  };

  const handleQuickInProgress = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = task.status === "in_progress" ? "pending" : "in_progress";
    setStatus.mutate({ taskId: task.id, status: newStatus });
  };

  return (
    <>
      <div
        className={cn(
          "group skeu-card relative rounded-[14px] border-l-[3px] p-3.5",
          urgencyBorder[urgency],
          isDragging && "scale-105 rotate-2 opacity-50 shadow-lg!",
          task.status === "done" && "opacity-60",
        )}
      >
        {/* Desktop quick actions - visible on hover, positioned top-right */}
        <div className="absolute top-2 right-2 hidden gap-1 opacity-0 transition-opacity group-hover:opacity-100 lg:flex">
          <button
            type="button"
            onClick={handleQuickInProgress}
            className={cn(
              "rounded-full p-1 transition-colors",
              task.status === "in_progress"
                ? "bg-warning/10 text-warning"
                : "text-muted-foreground hover:bg-warning/10 hover:text-warning",
            )}
            aria-label={
              task.status === "in_progress"
                ? "Remove from in progress"
                : "Mark as in progress"
            }
          >
            <Clock className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleQuickDone}
            className={cn(
              "rounded-full p-1 transition-colors",
              task.status === "done"
                ? "bg-success/10 text-success"
                : "text-muted-foreground hover:bg-success/10 hover:text-success",
            )}
            aria-label={
              task.status === "done" ? "Mark as not done" : "Mark as done"
            }
          >
            {task.status === "done" ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Circle className="size-4" />
            )}
          </button>
        </div>

        {/* Source type icon - bottom-right corner */}
        <SourceIcon source={task.source} className="absolute right-2.5 bottom-2.5 opacity-40" />

        {/* Mobile quick action - always visible */}
        <button
          type="button"
          onClick={handleQuickDone}
          className={cn(
            "absolute top-3.5 left-3.5 rounded-full transition-colors lg:hidden",
            task.status === "done" ? "text-success" : "text-muted-foreground",
          )}
          aria-label={
            task.status === "done" ? "Mark as not done" : "Mark as done"
          }
        >
          {task.status === "done" ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <Circle className="size-5" />
          )}
        </button>

        {/* Card content - clickable to open modal */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full pb-4 pl-6 text-left lg:pr-16 lg:pl-0"
        >
          <div className="flex items-start gap-2">
            <span
              className={cn(
                "line-clamp-2 flex-1 text-[13px] leading-snug font-medium",
                task.status === "done" && "line-through",
              )}
            >
              {task.title}
            </span>
          </div>

          {!compact && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CourseBadge course={task.course} />
              <CountdownBadge dueDate={task.dueDate} />
            </div>
          )}
        </button>
      </div>

      <TaskDetailModal task={task} open={open} onOpenChange={setOpen} />
    </>
  );
}
