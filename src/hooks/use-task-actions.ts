"use client";

import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { TaskPriority, TaskStatus, TaskWithCourse } from "@/types/task";

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
    onSuccess: (_data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      const label =
        status === "done"
          ? "Marked as done"
          : status === "dismissed"
            ? "Task dismissed"
            : status === "in_progress"
              ? "Marked as in progress"
              : "Status updated";
      toast.success(label);
    },
    onError: (err, _vars, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error("Failed to update status", { description: err.message });
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
    onSuccess: (_data, { priority }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(
        priority ? `Priority set to ${priority}` : "Priority cleared",
      );
    },
    onError: (err, _vars, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error("Failed to update priority", { description: err.message });
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

  return {
    setStatus,
    setPriority,
    setNotes,
  };
}
