"use client";

import { useMemo } from "react";
import type { TaskWithCourse, ActionBoardBuckets } from "@/types/task";

const DONE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TODO_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days ahead

export function useActionBoard(tasks: TaskWithCourse[]): ActionBoardBuckets {
  return useMemo(() => {
    const now = Date.now();
    const buckets: ActionBoardBuckets = {
      todo: [],
      inProgress: [],
      done: [],
    };

    for (const task of tasks) {
      if (task.status === "dismissed") continue;

      if (task.status === "done") {
        const completedAt = new Date(task.updatedAt).getTime();
        if (now - completedAt <= DONE_WINDOW_MS) {
          buckets.done.push(task);
        }
      } else if (task.status === "in_progress") {
        buckets.inProgress.push(task);
      } else {
        // Only show pending tasks due within the next 7 days (or overdue /
        // undated) — tasks further out are noise in the action board.
        const dueMs = task.dueDate ? new Date(task.dueDate).getTime() : null;
        if (dueMs === null || dueMs <= now + TODO_WINDOW_MS) {
          buckets.todo.push(task);
        }
      }
    }

    // To Do: most urgent (earliest due date) at top
    buckets.todo.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    // In Progress: most urgent at top
    buckets.inProgress.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    // Done: most recently completed first
    buckets.done.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    return buckets;
  }, [tasks]);
}
