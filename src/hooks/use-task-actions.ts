"use client";

import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { TaskPriority, TaskStatus, TaskWithCourse } from "@/types/task";
import {
  createCustomTask,
  updateCustomTask,
  deleteCustomTask,
} from "@/lib/actions/tasks";
import type {
  CreateCustomTaskInput,
  UpdateCustomTaskInput,
} from "@/lib/validations/tasks";

interface TaskOverridePayload {
  taskId: string;
  customStatus?: TaskStatus | null;
  priority?: TaskPriority | null;
  notes?: string | null;
}

async function getCurrentUserId() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return user.id;
}

/**
 * Fetch the existing override, merge with incoming changes, then upsert.
 * This prevents overwriting untouched fields to null.
 */
async function upsertTaskOverride(payload: TaskOverridePayload) {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  // Fetch existing override to preserve untouched fields
  const { data: existing } = await supabase
    .from("task_overrides")
    .select("custom_status, priority, notes")
    .eq("user_id", userId)
    .eq("task_id", payload.taskId)
    .maybeSingle();

  const merged = {
    custom_status:
      payload.customStatus !== undefined
        ? payload.customStatus
        : ((existing?.custom_status as TaskStatus | null) ?? null),
    priority:
      payload.priority !== undefined
        ? payload.priority
        : ((existing?.priority as TaskPriority | null) ?? null),
    notes:
      payload.notes !== undefined
        ? payload.notes
        : ((existing?.notes as string | null) ?? null),
  };

  const { error } = await supabase.from("task_overrides").upsert(
    {
      user_id: userId,
      task_id: payload.taskId,
      ...merged,
    },
    {
      onConflict: "user_id,task_id",
      ignoreDuplicates: false,
    },
  );

  if (error) throw error;
}

/**
 * Bulk-set `custom_status` via the browser Supabase client (same RLS/session as
 * {@link upsertTaskOverride}). Avoids Next.js server-action ID mismatches from
 * dev HMR / stale tabs while preserving priority and notes on existing rows.
 */
async function bulkSetOverrideStatusClient(
  taskIds: string[],
  status: TaskStatus,
) {
  if (taskIds.length === 0) return;
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { data: existingRows, error: fetchError } = await supabase
    .from("task_overrides")
    .select("task_id, priority, notes")
    .eq("user_id", userId)
    .in("task_id", taskIds);

  if (fetchError) throw fetchError;

  const byTask = new Map(
    (existingRows ?? []).map((r) => [
      r.task_id as string,
      r as { priority: unknown; notes: unknown },
    ]),
  );

  const rows = taskIds.map((taskId) => {
    const ex = byTask.get(taskId);
    return {
      user_id: userId,
      task_id: taskId,
      custom_status: status,
      priority: (ex?.priority as TaskPriority | null | undefined) ?? null,
      notes: (ex?.notes as string | null | undefined) ?? null,
    };
  });

  const { error } = await supabase.from("task_overrides").upsert(rows, {
    onConflict: "user_id,task_id",
    ignoreDuplicates: false,
  });

  if (error) throw error;
}

export function useTaskActions() {
  const queryClient = useQueryClient();

  const setStatus = useMutation<
    void,
    Error,
    { taskId: string; status: TaskStatus },
    { previousQueries: [QueryKey, TaskWithCourse[] | undefined][] }
  >({
    mutationFn: async ({ taskId, status }) => {
      await upsertTaskOverride({ taskId, customStatus: status });
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousQueries = queryClient.getQueriesData<TaskWithCourse[]>({
        queryKey: ["tasks"],
      });
      const now = new Date().toISOString();
      queryClient.setQueriesData<TaskWithCourse[]>(
        { queryKey: ["tasks"] },
        (old) => {
          if (!old) return old;
          return old.map((task) => {
            if (task.id !== taskId) return task;
            const displayStatus =
              status === "pending" &&
              task.dueDate &&
              new Date(task.dueDate) < new Date()
                ? ("overdue" as const)
                : status;
            return { ...task, status, displayStatus, updatedAt: now };
          });
        },
      );
      return { previousQueries };
    },
    onSuccess: (_data, { taskId, status }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (status === "dismissed") {
        queryClient.invalidateQueries({ queryKey: ["history-tasks"] });
      }
      const label =
        status === "done"
          ? "Marked as done"
          : status === "dismissed"
            ? "Task dismissed"
            : status === "in_progress"
              ? "Marked as in progress"
              : "Status updated";
      toast.success(label, { id: `status-${taskId}` });
    },
    onError: (err, { taskId }, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error("Failed to update status", { id: `status-${taskId}`, description: err.message });
    },
  });

  const setPriority = useMutation<
    void,
    Error,
    { taskId: string; priority: TaskPriority | null },
    { previousQueries: [QueryKey, TaskWithCourse[] | undefined][] }
  >({
    mutationFn: async ({ taskId, priority }) => {
      await upsertTaskOverride({ taskId, priority });
    },
    onMutate: async ({ taskId, priority }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousQueries = queryClient.getQueriesData<TaskWithCourse[]>({
        queryKey: ["tasks"],
      });
      queryClient.setQueriesData<TaskWithCourse[]>(
        { queryKey: ["tasks"] },
        (old) => {
          if (!old) return old;
          return old.map((task) =>
            task.id === taskId ? { ...task, priority } : task,
          );
        },
      );
      return { previousQueries };
    },
    onSuccess: (_data, { taskId, priority }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(
        priority ? `Priority set to ${priority}` : "Priority cleared",
        { id: `priority-${taskId}` },
      );
    },
    onError: (err, { taskId }, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error("Failed to update priority", { id: `priority-${taskId}`, description: err.message });
    },
  });

  const setNotes = useMutation<
    void,
    Error,
    { taskId: string; notes: string | null },
    { previousQueries: [QueryKey, TaskWithCourse[] | undefined][] }
  >({
    mutationFn: async ({ taskId, notes }) => {
      await upsertTaskOverride({ taskId, notes });
    },
    onMutate: async ({ taskId, notes }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousQueries = queryClient.getQueriesData<TaskWithCourse[]>({
        queryKey: ["tasks"],
      });
      queryClient.setQueriesData<TaskWithCourse[]>(
        { queryKey: ["tasks"] },
        (old) => {
          if (!old) return old;
          return old.map((task) =>
            task.id === taskId ? { ...task, notes } : task,
          );
        },
      );
      return { previousQueries };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Notes saved");
    },
    onError: (err, _vars, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error("Failed to save notes", { description: err.message });
    },
  });

  const createTask = useMutation<{ id?: string }, Error, CreateCustomTaskInput>(
    {
      mutationFn: async (input) => {
        const result = await createCustomTask(input);
        if (!result.success)
          throw new Error(result.error ?? "Failed to create task");
        return { id: result.id };
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        toast.success("Task created");
      },
      onError: (err) => {
        toast.error("Failed to create task", { description: err.message });
      },
    },
  );

  const editTask = useMutation<
    void,
    Error,
    { id: string; input: UpdateCustomTaskInput }
  >({
    mutationFn: async ({ id, input }) => {
      const result = await updateCustomTask(id, input);
      if (!result.success)
        throw new Error(result.error ?? "Failed to update task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated");
    },
    onError: (err) => {
      toast.error("Failed to update task", { description: err.message });
    },
  });

  const deleteTask = useMutation<
    void,
    Error,
    string,
    { previousQueries: [QueryKey, TaskWithCourse[] | undefined][] }
  >({
    mutationFn: async (id) => {
      const result = await deleteCustomTask(id);
      if (!result.success)
        throw new Error(result.error ?? "Failed to delete task");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousQueries = queryClient.getQueriesData<TaskWithCourse[]>({
        queryKey: ["tasks"],
      });
      queryClient.setQueriesData<TaskWithCourse[]>(
        { queryKey: ["tasks"] },
        (old) => {
          if (!old) return old;
          return old.filter((task) => task.id !== id);
        },
      );
      return { previousQueries };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: (err, _id, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error("Failed to delete task", { description: err.message });
    },
  });

  const dismissAll = useMutation<
    void,
    Error,
    string[],
    { previousQueries: [QueryKey, TaskWithCourse[] | undefined][] }
  >({
    mutationFn: async (taskIds) => {
      await bulkSetOverrideStatusClient(taskIds, "dismissed");
    },
    onMutate: async (taskIds) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousQueries = queryClient.getQueriesData<TaskWithCourse[]>({
        queryKey: ["tasks"],
      });
      const idSet = new Set(taskIds);
      queryClient.setQueriesData<TaskWithCourse[]>(
        { queryKey: ["tasks"] },
        (old) => {
          if (!old) return old;
          return old.map((task) =>
            idSet.has(task.id)
              ? {
                  ...task,
                  status: "dismissed" as const,
                  displayStatus: "dismissed" as const,
                }
              : task,
          );
        },
      );
      return { previousQueries };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["history-tasks"] });
      toast.success("All done tasks dismissed");
    },
    onError: (err, _ids, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error("Failed to dismiss tasks", { description: err.message });
    },
  });

  const archivePastDue = useMutation<
    void,
    Error,
    string[],
    { previousQueries: [QueryKey, TaskWithCourse[] | undefined][] }
  >({
    mutationFn: async (taskIds) => {
      await bulkSetOverrideStatusClient(taskIds, "done");
    },
    onMutate: async (taskIds) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousQueries = queryClient.getQueriesData<TaskWithCourse[]>({
        queryKey: ["tasks"],
      });
      const idSet = new Set(taskIds);
      queryClient.setQueriesData<TaskWithCourse[]>(
        { queryKey: ["tasks"] },
        (old) => {
          if (!old) return old;
          return old.map((task) =>
            idSet.has(task.id)
              ? { ...task, status: "done" as const, displayStatus: "done" as const }
              : task,
          );
        },
      );
      return { previousQueries };
    },
    onSuccess: (_data, taskIds) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`Archived ${taskIds.length} past tasks`);
    },
    onError: (err, _ids, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error("Failed to archive tasks", { description: err.message });
    },
  });

  return {
    setStatus,
    setPriority,
    setNotes,
    createTask,
    editTask,
    deleteTask,
    dismissAll,
    archivePastDue,
  };
}
