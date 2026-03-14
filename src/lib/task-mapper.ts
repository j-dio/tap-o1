import type {
  TaskWithCourse,
  TaskSource,
  TaskType,
  TaskStatus,
  TaskPriority,
  TaskDisplayStatus,
} from "@/types/task";

export function mapRow(row: Record<string, unknown>): TaskWithCourse {
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
    isCustom: (row.is_custom as boolean) ?? false,
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
