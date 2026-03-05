"use client";

import { useMemo, useState } from "react";
import type { TaskWithCourse, ActionBoardBuckets } from "@/types/task";

const DONE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Pure bucketing logic extracted from the hook so it can be unit-tested
 * without a React renderer.
 *
 * @param tasks          All tasks from useTasks.
 * @param now            Epoch ms timestamp to compare against (pass Date.now()).
 * @param todoWindowDays How many days ahead to include in the To Do bucket.
 */
export function computeActionBoardBuckets(
  tasks: TaskWithCourse[],
  now: number,
  todoWindowDays: number,
): ActionBoardBuckets {
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
      if (now - completedAt <= DONE_WINDOW_MS) {
        buckets.done.push(task);
      }
    } else if (task.status === "in_progress") {
      buckets.inProgress.push(task);
    } else {
      const dueMs = task.dueDate ? new Date(task.dueDate).getTime() : null;
      if (dueMs === null || dueMs <= now + todoWindowMs) {
        buckets.todo.push(task);
      } else {
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
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return buckets;
}

/**
 * @param tasks          All tasks returned by useTasks.
 * @param todoWindowDays How many days ahead to include in the To Do bucket
 *                       (default 7). Controlled by the Show More/Less buttons.
 */
export function useActionBoard(
  tasks: TaskWithCourse[],
  todoWindowDays = 7,
): ActionBoardBuckets {
  // Snapshot the current time once at mount via useState's lazy initialiser.
  // Passing `Date.now` as a function *reference* means React calls it
  // internally — the React Compiler never sees a direct impure call.
  const [snapNow] = useState(Date.now);

  return useMemo(
    () => computeActionBoardBuckets(tasks, snapNow, todoWindowDays),
    [tasks, snapNow, todoWindowDays],
  );
}
