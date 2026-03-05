"use client";

import { useMemo } from "react";
import type { TaskWithCourse } from "@/types/task";

const FOCUS_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useFocusMode(tasks: TaskWithCourse[]): TaskWithCourse[] {
  return useMemo(() => {
    const now = new Date();
    const threshold = new Date(now.getTime() + FOCUS_WINDOW_MS);

    return tasks
      .filter((task) => {
        if (task.status === "done" || task.status === "dismissed") return false;
        if (!task.dueDate) return false;

        const dueDate = new Date(task.dueDate);
        // Include overdue tasks and tasks due within 24 hours
        return dueDate <= threshold;
      })
      .sort((a, b) => {
        return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
      });
  }, [tasks]);
}
