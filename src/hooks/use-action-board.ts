"use client";

import { useMemo, useState } from "react";
import type { TaskWithCourse, ActionBoardBuckets } from "@/types/task";

const DONE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * @param tasks        All tasks returned by useTasks.
 * @param todoWindowDays  How many days ahead to include in the To Do bucket
 *                        (default 7). Increase via the Show More control.
 */
export function useActionBoard(
  tasks: TaskWithCourse[],
  todoWindowDays = 7,
): ActionBoardBuckets {
  // Snapshot the current time once at mount via useState's lazy initialiser.
  // Passing `Date.now` as a function *reference* (not invoking it) means React
  // calls it internally — the React Compiler does not see a direct impure call
  // during render.
  const [snapNow] = useState(Date.now);

  return useMemo(() => {
    const todoWindowMs = todoWindowDays * 24 * 60 * 60 * 1000;
    const buckets: ActionBoardBuckets = {
      todo: [],
      inProgress: [],
      done: [],
      todoHasMore: false,
    };

    for (const task of tasks) {
      if (task.status === "dismissed") continue;

      if (task.status === "done") {
        const completedAt = new Date(task.updatedAt).getTime();
        if (snapNow - completedAt <= DONE_WINDOW_MS) {
          buckets.done.push(task);
        }
      } else if (task.status === "in_progress") {
        buckets.inProgress.push(task);
      } else {
        const dueMs = task.dueDate ? new Date(task.dueDate).getTime() : null;
        if (dueMs === null || dueMs <= snapNow + todoWindowMs) {
          buckets.todo.push(task);
        } else {
          // Task exists beyond the current window — more are available
          buckets.todoHasMore = true;
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
  }, [tasks, todoWindowDays, snapNow]);
}
