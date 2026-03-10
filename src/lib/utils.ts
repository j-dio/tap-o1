import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  TaskUrgency,
  TaskWithCourse,
  TaskDisplayStatus,
} from "@/types/task";

export type SortOption = "due-date" | "priority" | "type" | "title";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date relative to now (e.g., "in 2 hours", "3 days ago").
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffMins) < 1) return "just now";

  if (diffMs > 0) {
    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    if (diffDays < 7) return `in ${diffDays}d`;
    return date.toLocaleDateString();
  }

  if (Math.abs(diffMins) < 60) return `${Math.abs(diffMins)}m ago`;
  if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)}h ago`;
  if (Math.abs(diffDays) < 7) return `${Math.abs(diffDays)}d ago`;
  return date.toLocaleDateString();
}

/**
 * Check if a task is overdue based on its due date.
 */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

/**
 * Classify task urgency based on due date.
 * - overdue: past due
 * - urgent: due within 24 hours
 * - soon: due within 3 days
 * - upcoming: due within 7 days
 * - later: due after 7 days
 * - none: no due date
 */
export function getTaskUrgency(dueDate: string | null): TaskUrgency {
  if (!dueDate) return "none";
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) return "overdue";
  if (diffHours < 24) return "urgent";
  if (diffHours < 72) return "soon";
  if (diffHours < 168) return "upcoming";
  return "later";
}

/**
 * Build a comparator function based on the active sort option.
 */
export function getTaskComparator(
  sort: SortOption = "due-date",
): (a: TaskWithCourse, b: TaskWithCourse) => number {
  return (a, b) => {
    switch (sort) {
      case "priority": {
        const pa = PRIORITY_ORDER[a.priority ?? ""] ?? 99;
        const pb = PRIORITY_ORDER[b.priority ?? ""] ?? 99;
        if (pa !== pb) return pa - pb;
        // Fall back to due date
        break;
      }
      case "type": {
        const cmp = (a.type ?? "").localeCompare(b.type ?? "");
        if (cmp !== 0) return cmp;
        break;
      }
      case "title":
        return (a.title ?? "").localeCompare(b.title ?? "");
      default:
        break;
    }
    // Default / fallback: due date ascending
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  };
}

interface GroupOptions {
  /** Active status filter — when set to done/dismissed, include those tasks */
  statusFilter?: TaskDisplayStatus;
  /** Sort applied within each bucket */
  sort?: SortOption;
}

/**
 * Group tasks into urgency buckets for the board view.
 * When statusFilter is "done" or "dismissed", those tasks are shown in the
 * "later" bucket instead of being hidden.
 */
export function groupTasksByUrgency(
  tasks: TaskWithCourse[],
  options: GroupOptions = {},
) {
  const { statusFilter, sort = "due-date" } = options;
  const showCompleted = statusFilter === "done" || statusFilter === "dismissed";

  const buckets = {
    overdue: [] as TaskWithCourse[],
    today: [] as TaskWithCourse[],
    thisWeek: [] as TaskWithCourse[],
    later: [] as TaskWithCourse[],
  };

  for (const task of tasks) {
    // Only skip done/dismissed when no explicit status filter is active
    if (
      !showCompleted &&
      (task.status === "done" || task.status === "dismissed")
    )
      continue;

    // Done/dismissed tasks go to "later" bucket for display
    if (
      showCompleted &&
      (task.status === "done" || task.status === "dismissed")
    ) {
      buckets.later.push(task);
      continue;
    }

    const urgency = getTaskUrgency(task.dueDate);
    switch (urgency) {
      case "overdue":
        buckets.overdue.push(task);
        break;
      case "urgent":
        buckets.today.push(task);
        break;
      case "soon":
      case "upcoming":
        buckets.thisWeek.push(task);
        break;
      default:
        buckets.later.push(task);
        break;
    }
  }

  const comparator = getTaskComparator(sort);
  buckets.overdue.sort(comparator);
  buckets.today.sort(comparator);
  buckets.thisWeek.sort(comparator);
  buckets.later.sort(comparator);

  return buckets;
}

/**
 * Group tasks by day for the week view.
 */
export function groupTasksByDay(
  tasks: TaskWithCourse[],
): Map<string, TaskWithCourse[]> {
  const groups = new Map<string, TaskWithCourse[]>();
  for (const task of tasks) {
    const key = task.dueDate
      ? new Date(task.dueDate).toISOString().slice(0, 10)
      : "no-date";
    const list = groups.get(key) ?? [];
    list.push(task);
    groups.set(key, list);
  }
  return groups;
}

/**
 * Generate a unique HSL color string for a course based on its ID.
 * Uses a hash-based hue with fixed saturation/lightness for consistent,
 * visually distinct colors that avoid the 5-color collision of the old palette.
 */
export function generateCourseColor(courseId: string): string {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash * 31 + courseId.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Get a deterministic chart color variable for a course.
 * Prefers persisted `courseColor`, falls back to HSL generation.
 */
export function getCourseColor(
  courseId: string | null,
  courseColor: string | null,
): string {
  if (courseColor) return courseColor;
  if (!courseId) return "hsl(0, 70%, 60%)";
  return generateCourseColor(courseId);
}

/**
 * Get the start of a week (Monday) for a given date.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get array of 7 dates for a week starting from Monday.
 */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/**
 * Format a date as a short day label (e.g., "Mon 24").
 */
export function formatDayLabel(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[date.getDay()]} ${date.getDate()}`;
}

/**
 * Check if two dates are the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
