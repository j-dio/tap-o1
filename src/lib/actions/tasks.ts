"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createCustomTaskSchema,
  updateCustomTaskSchema,
} from "@/lib/validations/tasks";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

/**
 * Create a custom task for the authenticated user.
 * Generates a UUID for `external_id`, sets `source = 'custom'` and `is_custom = true`.
 */
export async function createCustomTask(input: unknown): Promise<ActionResult> {
  const parsed = createCustomTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { title, description, dueDate, type, courseId, priority } = parsed.data;

  const externalId = crypto.randomUUID();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      external_id: externalId,
      source: "custom",
      is_custom: true,
      title,
      description: description ?? null,
      due_date: dueDate ?? null,
      type: type ?? "assignment",
      course_id: courseId ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (taskError) {
    return { success: false, error: taskError.message };
  }

  // If priority was provided, create a task_overrides row
  if (priority && task) {
    const { error: overrideError } = await supabase
      .from("task_overrides")
      .upsert(
        {
          user_id: user.id,
          task_id: task.id,
          priority,
        },
        { onConflict: "user_id,task_id", ignoreDuplicates: false },
      );

    if (overrideError) {
      return { success: false, error: overrideError.message };
    }
  }

  return { success: true, id: task.id };
}

/**
 * Update a custom task. Only tasks with `is_custom = true` can be updated via
 * this action (imported tasks are managed by their sync source).
 */
export async function updateCustomTask(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = updateCustomTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { title, description, dueDate, type, courseId, priority } = parsed.data;

  // Guard: only allow updating custom tasks
  const { data: existing } = await supabase
    .from("tasks")
    .select("is_custom")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing?.is_custom) {
    return { success: false, error: "Only custom tasks can be edited" };
  }

  const updates: Record<string, unknown> = { title };
  if (description !== undefined) updates.description = description;
  if (dueDate !== undefined) updates.due_date = dueDate;
  if (type !== undefined) updates.type = type;
  if (courseId !== undefined) updates.course_id = courseId;

  const { error: updateError } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Handle priority via task_overrides
  if (priority !== undefined) {
    const { error: overrideError } = await supabase
      .from("task_overrides")
      .upsert(
        {
          user_id: user.id,
          task_id: id,
          priority,
        },
        { onConflict: "user_id,task_id", ignoreDuplicates: false },
      );

    if (overrideError) {
      return { success: false, error: overrideError.message };
    }
  }

  return { success: true, id };
}

/**
 * Hard-delete a custom task. Only tasks with `is_custom = true` can be deleted.
 * Cascade delete handles associated `task_overrides`.
 */
export async function deleteCustomTask(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Guard: only allow deleting custom tasks
  const { data: existing } = await supabase
    .from("tasks")
    .select("is_custom")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing?.is_custom) {
    return { success: false, error: "Only custom tasks can be deleted" };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Dismiss all done tasks by bulk-upserting `task_overrides` with
 * `custom_status = 'dismissed'`.
 */
export async function dismissAllDone(
  doneTaskIds: string[],
): Promise<ActionResult> {
  return bulkSetStatus(doneTaskIds, "dismissed");
}

/**
 * Bulk-upsert `task_overrides` with the given `custom_status` for all
 * provided task IDs. Used for batch operations like archive-on-first-sync.
 */
export async function bulkSetStatus(
  taskIds: string[],
  status: string,
): Promise<ActionResult> {
  if (taskIds.length === 0) return { success: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const rows = taskIds.map((taskId) => ({
    user_id: user.id,
    task_id: taskId,
    custom_status: status,
  }));

  const { error } = await supabase.from("task_overrides").upsert(rows, {
    onConflict: "user_id,task_id",
    ignoreDuplicates: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
