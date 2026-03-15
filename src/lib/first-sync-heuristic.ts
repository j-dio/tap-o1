import type { TaskWithCourse } from "@/types/task";

export const FIRST_SYNC_HANDLED_KEY = "firstSyncHandled";
export const FIRST_SYNC_BANNER_THRESHOLD = 3;

/**
 * Returns UVEC pending tasks whose due date is older than `cutoffDays`.
 *
 * GClassroom is excluded — submission state is resolved at sync time.
 * Custom tasks are excluded — they should never be touched by automation.
 */
export function getPastDueCandidates(
  tasks: TaskWithCourse[],
  cutoffDays: number,
): TaskWithCourse[] {
  const cutoff = new Date(Date.now() - cutoffDays * 86_400_000);
  return tasks.filter(
    (t) =>
      t.source === "uvec" &&
      !t.isCustom &&
      t.status === "pending" &&
      t.dueDate !== null &&
      new Date(t.dueDate) < cutoff,
  );
}
