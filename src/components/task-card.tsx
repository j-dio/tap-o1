"use client";

import { useState } from "react";
import type { TaskWithCourse } from "@/types/task";
import { getTaskUrgency, cn } from "@/lib/utils";
import { CourseBadge } from "@/components/course-badge";
import { CountdownBadge } from "@/components/countdown-badge";
import { SourceIcon } from "@/components/source-icon";
import { Badge } from "@/components/ui/badge";
import { TaskDetailModal } from "@/components/task-detail-modal";

interface TaskCardProps {
  task: TaskWithCourse;
}

/** Tasks added within the last 5 minutes are considered "new" */
const NEW_THRESHOLD_MS = 5 * 60 * 1000;

function isNewTask(createdAt: string): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < NEW_THRESHOLD_MS;
}

const urgencyBorder: Record<string, string> = {
  overdue: "border-l-destructive",
  urgent: "border-l-warning",
  soon: "border-l-info",
  upcoming: "border-l-border",
  later: "border-l-border",
  none: "border-l-border",
};

export function TaskCard({ task }: TaskCardProps) {
  const [open, setOpen] = useState(false);
  const urgency = getTaskUrgency(task.dueDate);
  const isNew = isNewTask(task.createdAt);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "bg-card hover:bg-accent/50 w-full rounded-lg border border-l-[3px] p-3 text-left transition-colors",
          urgencyBorder[urgency],
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="line-clamp-2 text-sm leading-snug font-medium">
              {task.title}
            </span>
            {isNew && (
              <Badge
                variant="default"
                className="bg-primary shrink-0 animate-pulse px-1 py-0 text-[9px] leading-tight"
              >
                NEW
              </Badge>
            )}
          </div>
          <SourceIcon source={task.source} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <CourseBadge course={task.course} />
          {task.type !== "assignment" && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {task.type}
            </Badge>
          )}
          {task.priority && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {task.priority}
            </Badge>
          )}
          <CountdownBadge dueDate={task.dueDate} className="ml-auto" />
        </div>
      </button>

      <TaskDetailModal task={task} open={open} onOpenChange={setOpen} />
    </>
  );
}
