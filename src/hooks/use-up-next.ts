"use client";

import { useMemo, useState } from "react";
import type { TaskWithCourse } from "@/types/task";
import {
  ACTION_BOARD_TODO_WINDOW_DAYS,
  isTaskOnActionBoardActiveColumns,
} from "@/hooks/use-action-board";

/**
 * Pure selection logic for tests and for {@link useUpNext}.
 * Only considers tasks that would appear in To Do or In Progress on the board
 * (same due-date window as the action board).
 */
export function pickUpNextTask(
  tasks: TaskWithCourse[],
  now: number,
  todoWindowDays: number,
): TaskWithCourse | null {
  const active = tasks.filter(
    (t) =>
      (t.status === "pending" || t.status === "in_progress") &&
      isTaskOnActionBoardActiveColumns(t, now, todoWindowDays),
  );

  if (active.length === 0) return null;

  const inProgress = active
    .filter((t) => t.status === "in_progress" && t.dueDate)
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
    );

  if (inProgress.length > 0) return inProgress[0];

  const inProgressNoDue = active.find(
    (t) => t.status === "in_progress" && !t.dueDate,
  );
  if (inProgressNoDue) return inProgressNoDue;

  const pendingWithDue = active
    .filter((t) => t.status === "pending" && t.dueDate)
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
    );

  if (pendingWithDue.length > 0) return pendingWithDue[0];

  return active[0];
}

export function useUpNext(tasks: TaskWithCourse[]): TaskWithCourse | null {
  const [snapNow] = useState(Date.now);

  return useMemo(
    () => pickUpNextTask(tasks, snapNow, ACTION_BOARD_TODO_WINDOW_DAYS),
    [tasks, snapNow],
  );
}
