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

const urgencyGlow: Record<string, string> = {
  overdue: "before:bg-destructive/5",
  urgent: "before:bg-warning/5",
  soon: "before:bg-info/5",
  upcoming: "",
  later: "",
  none: "",
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
          "group skeu-card relative rounded-[14px] border-l-[3px] overflow-hidden",
          urgencyBorder[urgency],
          isDragging && "scale-105 rotate-2 opacity-50 shadow-lg!",
          task.status === "done" && "opacity-60",
        )}
      >
        {/* Subtle urgency tint strip */}
        {(urgency === "overdue" || urgency === "urgent" || urgency === "soon") && (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 opacity-100",
              urgencyGlow[urgency],
            )}
          />
        )}

        {/* Desktop quick actions — top-right, appear on hover */}
        <div className="absolute top-2.5 right-2.5 hidden items-center gap-0.5 opacity-0 transition-all duration-150 group-hover:opacity-100 lg:flex">
          <button
            type="button"
            onClick={handleQuickInProgress}
            className={cn(
              "flex size-6 items-center justify-center rounded-md transition-all duration-150",
              task.status === "in_progress"
                ? "bg-warning/15 text-warning"
                : "text-muted-foreground hover:bg-warning/12 hover:text-warning",
            )}
            aria-label={
              task.status === "in_progress"
                ? "Remove from in progress"
                : "Mark as in progress"
            }
          >
            <Clock className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleQuickDone}
            className={cn(
              "flex size-6 items-center justify-center rounded-md transition-all duration-150",
              task.status === "done"
                ? "bg-success/15 text-success"
                : "text-muted-foreground hover:bg-success/12 hover:text-success",
            )}
            aria-label={
              task.status === "done" ? "Mark as not done" : "Mark as done"
            }
          >
            {task.status === "done" ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <Circle className="size-3.5" />
            )}
          </button>
        </div>

        {/* Source type icon — bottom-right, very subtle */}
        <SourceIcon source={task.source} className="absolute right-2.5 bottom-2.5 opacity-30" />

        {/* Mobile quick action — always visible */}
        <button
          type="button"
          onClick={handleQuickDone}
          className={cn(
            "absolute top-3.5 left-3.5 rounded-full transition-colors lg:hidden",
            task.status === "done" ? "text-success" : "text-muted-foreground/60",
          )}
          aria-label={
            task.status === "done" ? "Mark as not done" : "Mark as done"
          }
        >
          {task.status === "done" ? (
            <CheckCircle2 className="size-4.5" />
          ) : (
            <Circle className="size-4.5" />
          )}
        </button>

        {/* Card content — clickable to open modal */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full px-3.5 pt-3 pb-3.5 pl-6 text-left lg:pr-14 lg:pl-3.5"
        >
          <span
            className={cn(
              "line-clamp-2 block text-[13px] leading-[1.45] font-medium tracking-[-0.01em]",
              task.status === "done" && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </span>

          {!compact && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
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
