"use client";

import { useMemo } from "react";
import type { TaskWithCourse } from "@/types/task";

export function useUpNext(tasks: TaskWithCourse[]): TaskWithCourse | null {
  return useMemo(() => {
    const active = tasks.filter(
      (t) => t.status === "pending" || t.status === "in_progress",
    );

    if (active.length === 0) return null;

    // Prioritize in-progress tasks (user explicitly working on them)
    const inProgress = active
      .filter((t) => t.status === "in_progress" && t.dueDate)
      .sort(
        (a, b) =>
          new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
      );

    if (inProgress.length > 0) return inProgress[0];

    // In-progress without due date
    const inProgressNoDue = active.find(
      (t) => t.status === "in_progress" && !t.dueDate,
    );
    if (inProgressNoDue) return inProgressNoDue;

    // Most urgent pending task with a due date
    const pendingWithDue = active
      .filter((t) => t.status === "pending" && t.dueDate)
      .sort(
        (a, b) =>
          new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
      );

    if (pendingWithDue.length > 0) return pendingWithDue[0];

    // Fallback: first pending task without a due date
    return active[0];
  }, [tasks]);
}
