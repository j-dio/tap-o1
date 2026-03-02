"use client";

import { useMemo } from "react";
import type { TaskWithCourse } from "@/types/task";
import { useTaskActions } from "@/hooks/use-task-actions";
import { Button } from "@/components/ui/button";

interface TaskActionsProps {
  task: TaskWithCourse;
}

export function TaskActions({ task }: TaskActionsProps) {
  const { setStatus } = useTaskActions();

  const isSavingStatus = useMemo(
    () => setStatus.isPending && setStatus.variables?.taskId === task.id,
    [setStatus.isPending, setStatus.variables?.taskId, task.id],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={task.status === "done" ? "default" : "outline"}
        disabled={isSavingStatus}
        onClick={() => {
          setStatus.mutate({ taskId: task.id, status: "done" });
        }}
      >
        Mark done
      </Button>

      <Button
        type="button"
        size="sm"
        variant={task.status === "dismissed" ? "secondary" : "outline"}
        disabled={isSavingStatus}
        onClick={() => {
          setStatus.mutate({ taskId: task.id, status: "dismissed" });
        }}
      >
        Dismiss
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isSavingStatus}
        onClick={() => {
          setStatus.mutate({ taskId: task.id, status: "pending" });
        }}
      >
        Reset
      </Button>
    </div>
  );
}
