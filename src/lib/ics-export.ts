import { createEvents } from "ics";
import type { EventAttributes } from "ics";
import type { TaskWithCourse } from "@/types/task";

export interface IcsExportResult {
  content: string;
  count: number;
}

const SOURCE_LABELS: Record<string, string> = {
  uvec: "UVEC",
  gclassroom: "Google Classroom",
  custom: "Custom",
};

/**
 * Converts an array of tasks into an RFC 5545-compliant ICS string.
 *
 * Follows the computeActionBoardBuckets pattern — pure function with no side
 * effects, zero DOM dependency, testable in Vitest node environment.
 *
 * Filtering rules:
 * - Include: displayStatus === "pending" | "overdue", or status === "in_progress"
 * - Exclude: dueDate === null (silently skipped)
 * - Exclude: displayStatus === "done" | "dismissed"
 *
 * Returns null when:
 * - No exportable tasks remain after filtering
 * - The ics createEvents call fails
 */
export function generateIcsContent(
  tasks: TaskWithCourse[],
): IcsExportResult | null {
  const exportable = tasks.filter((t) => {
    // Exclude tasks with no due date — nothing to place on a calendar
    if (t.dueDate === null) return false;

    const ds = t.displayStatus;

    // If displayStatus is set, use it as the primary filter
    if (ds === "done" || ds === "dismissed") return false;
    if (ds === "pending" || ds === "overdue") return true;

    // Fall back to raw status for tasks without displayStatus computed
    return t.status === "pending" || t.status === "in_progress";
  });

  if (exportable.length === 0) return null;

  const events: EventAttributes[] = exportable.map((task) => {
    const due = new Date(task.dueDate!);
    const year = due.getUTCFullYear();
    const month = due.getUTCMonth() + 1; // ics uses 1-based months
    const day = due.getUTCDate();

    // Exclusive end = day after due date (RFC 5545 all-day convention)
    const endDay = new Date(due);
    endDay.setUTCDate(endDay.getUTCDate() + 1);

    const sourceName = SOURCE_LABELS[task.source] ?? task.source;
    const courseName = task.course?.name ?? "No course";

    let description = `Course: ${courseName} (${sourceName})`;
    if (task.url) {
      description += `\nOpen: ${task.url}`;
    }

    return {
      uid: `${task.source}-${task.id}@tapo1.app`,
      title: task.title,
      description,
      start: [year, month, day] as [number, number, number],
      end: [
        endDay.getUTCFullYear(),
        endDay.getUTCMonth() + 1,
        endDay.getUTCDate(),
      ] as [number, number, number],
    };
  });

  const { error, value } = createEvents(events);
  if (error || !value) return null;

  return { content: value, count: exportable.length };
}
