"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  TaskWithCourse,
  TaskSource,
  TaskType,
  TaskStatus,
  TaskPriority,
  TaskDisplayStatus,
} from "@/types/task";

export interface TaskFilters {
  source?: TaskSource;
  type?: TaskType;
  courseId?: string;
  status?: TaskDisplayStatus;
  /** How many days back to include overdue tasks (default 30) */
  overdueWindowDays?: number;
  /** How many days ahead to include future tasks (default 60) */
  laterWindowDays?: number;
}

function mapRow(row: Record<string, unknown>): TaskWithCourse {
  const course = row.courses as Record<string, unknown> | null;
  const overrides = row.task_overrides as Record<string, unknown>[] | null;
  const override = overrides?.[0] ?? null;
  const baseStatus = ((row.status as string) ?? "pending") as TaskStatus;
  const customStatus = (override?.custom_status as TaskStatus | null) ?? null;
  const effectiveStatus = customStatus ?? baseStatus;
  const dueDate = (row.due_date as string) ?? null;
  const displayStatus: TaskDisplayStatus =
    effectiveStatus === "pending" && dueDate && new Date(dueDate) < new Date()
      ? "overdue"
      : effectiveStatus;
  // Use the more recent of tasks.updated_at and task_overrides.updated_at so that
  // marking a task as done (which only touches the override row) results in an
  // up-to-date updatedAt, keeping the task visible in the done window.
  const taskUpdatedAt = (row.updated_at as string) ?? "";
  const overrideUpdatedAt = (override?.updated_at as string) ?? null;
  const effectiveUpdatedAt =
    overrideUpdatedAt && overrideUpdatedAt > taskUpdatedAt
      ? overrideUpdatedAt
      : taskUpdatedAt;

  return {
    id: row.id as string,
    userId: row.user_id as string,
    courseId: (row.course_id as string) ?? null,
    source: row.source as TaskSource,
    externalId: row.external_id as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    type: (row.type as TaskType) ?? "assignment",
    status: effectiveStatus,
    dueDate,
    url: (row.url as string) ?? null,
    metadata: {},
    fetchedAt: taskUpdatedAt,
    createdAt: (row.created_at as string) ?? "",
    updatedAt: effectiveUpdatedAt,
    priority: (override?.priority as TaskPriority | null) ?? null,
    notes: (override?.notes as string | null) ?? null,
    displayStatus,
    course: course
      ? {
          id: course.id as string,
          userId: course.user_id as string,
          source: course.source as TaskSource,
          externalId: course.external_id as string,
          name: course.name as string,
          shortName: null,
          instructor: null,
          color: (course.color as string) ?? null,
          isArchived: false,
          createdAt: (course.created_at as string) ?? "",
        }
      : null,
  };
}

async function fetchTasks(filters: TaskFilters): Promise<TaskWithCourse[]> {
  const supabase = createClient();

  // Compute date window boundaries
  const overdueFloor = new Date();
  overdueFloor.setDate(
    overdueFloor.getDate() - (filters.overdueWindowDays ?? 30),
  );
  const laterCeiling = new Date();
  laterCeiling.setDate(
    laterCeiling.getDate() + (filters.laterWindowDays ?? 60),
  );

  // Try with task_overrides join first; fall back without if the table/FK is missing
  let selectStr = "*, courses(*), task_overrides(*)";
  let query = supabase
    .from("tasks")
    .select(selectStr)
    .order("due_date", { ascending: true, nullsFirst: false });

  // Apply date window: include null due_date, and constrain known dates to the window
  query = query.or(
    `due_date.is.null,and(due_date.gte.${overdueFloor.toISOString()},due_date.lte.${laterCeiling.toISOString()})`,
  );

  if (filters.source) {
    query = query.eq("source", filters.source);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.courseId) {
    query = query.eq("course_id", filters.courseId);
  }
  if (
    filters.status &&
    filters.status !== "overdue" &&
    filters.status !== "in_progress"
  ) {
    query = query.eq("status", filters.status);
  }

  let result = await query;

  // PGRST200: relationship not found — retry without task_overrides
  if (result.error && result.error.code === "PGRST200") {
    selectStr = "*, courses(*)";
    let fallbackQuery = supabase
      .from("tasks")
      .select(selectStr)
      .order("due_date", { ascending: true, nullsFirst: false });

    fallbackQuery = fallbackQuery.or(
      `due_date.is.null,and(due_date.gte.${overdueFloor.toISOString()},due_date.lte.${laterCeiling.toISOString()})`,
    );

    if (filters.source)
      fallbackQuery = fallbackQuery.eq("source", filters.source);
    if (filters.type) fallbackQuery = fallbackQuery.eq("type", filters.type);
    if (filters.courseId)
      fallbackQuery = fallbackQuery.eq("course_id", filters.courseId);
    if (
      filters.status &&
      filters.status !== "overdue" &&
      filters.status !== "in_progress"
    ) {
      fallbackQuery = fallbackQuery.eq("status", filters.status);
    }

    result = await fallbackQuery;
  }

  if (result.error) throw result.error;

  const rows = (result.data ?? []) as unknown as Record<string, unknown>[];
  const mapped = rows.map(mapRow);

  if (filters.status) {
    return mapped.filter((task) => task.displayStatus === filters.status);
  }

  return mapped;
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => fetchTasks(filters),
    // Use global QueryProvider defaults (5 min staleTime, no refetchOnWindowFocus)
    // to avoid load spikes at scale — do not override here
  });
}
