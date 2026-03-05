"use client";

import type { TaskWithCourse } from "@/types/task";
import { formatRelativeDate, getTaskUrgency, cn } from "@/lib/utils";
import { CourseBadge } from "@/components/course-badge";
import { SourceIcon } from "@/components/source-icon";
import { TaskActions } from "@/components/task-actions";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Clock } from "lucide-react";

interface TaskDetailModalProps {
  task: TaskWithCourse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const urgencyLabel: Record<string, string> = {
  overdue: "Overdue",
  urgent: "Due today",
  soon: "Due soon",
  upcoming: "Upcoming",
  later: "Later",
  none: "No due date",
};

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
}: TaskDetailModalProps) {
  const urgency = getTaskUrgency(task.dueDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="text-muted-foreground mb-1 flex items-center gap-2">
            <SourceIcon source={task.source} />
            <span className="text-xs capitalize">
              {task.source === "gclassroom" ? "Google Classroom" : "UVEC"}
            </span>
          </div>
          <DialogTitle className="text-base">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <CourseBadge course={task.course} />
          <Badge variant="secondary" className="text-xs">
            {task.type}
          </Badge>
          <Badge
            variant={
              task.displayStatus === "overdue"
                ? "destructive"
                : task.status === "in_progress"
                  ? "default"
                  : "secondary"
            }
            className={cn(
              "text-xs",
              task.status === "in_progress" &&
                "bg-warning text-warning-foreground",
            )}
          >
            {task.status === "in_progress"
              ? "in progress"
              : (task.displayStatus ?? task.status)}
          </Badge>
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="text-muted-foreground size-4" />
            <span>
              {new Date(task.dueDate).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            <span
              className={
                urgency === "overdue"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }
            >
              ({urgencyLabel[urgency]} &middot;{" "}
              {formatRelativeDate(new Date(task.dueDate))})
            </span>
          </div>
        )}

        {task.description && (
          <>
            <Separator />
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {task.description}
            </p>
          </>
        )}

        <Separator />
        <TaskActions task={task} />
      </DialogContent>
    </Dialog>
  );
}
