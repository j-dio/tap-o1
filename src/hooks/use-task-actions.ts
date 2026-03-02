"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { TaskPriority, TaskStatus } from "@/types/task";

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

async function upsertTaskOverride(payload: TaskOverridePayload) {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase.from("task_overrides").upsert(
    {
      user_id: userId,
      task_id: payload.taskId,
      custom_status: payload.customStatus,
      priority: payload.priority,
      notes: payload.notes,
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

  const setStatus = useMutation<void, Error, { taskId: string; status: TaskStatus }>(
    {
      mutationFn: async ({ taskId, status }) => {
        await upsertTaskOverride({ taskId, customStatus: status });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      },
    },
  );

  const setPriority = useMutation<
    void,
    Error,
    { taskId: string; priority: TaskPriority | null }
  >({
    mutationFn: async ({ taskId, priority }) => {
      await upsertTaskOverride({ taskId, priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const setNotes = useMutation<void, Error, { taskId: string; notes: string | null }>(
    {
      mutationFn: async ({ taskId, notes }) => {
        await upsertTaskOverride({ taskId, notes });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      },
    },
  );

  return {
    setStatus,
    setPriority,
    setNotes,
  };
}
