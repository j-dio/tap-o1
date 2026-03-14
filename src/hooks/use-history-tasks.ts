"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { mapRow } from "@/lib/task-mapper";
import type { TaskWithCourse } from "@/types/task";

async function fetchHistoryTasks(): Promise<TaskWithCourse[]> {
  const supabase = createClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Query from task_overrides so the filters are on the main table's columns —
  // filtering on embedded resource columns via .eq("task_overrides.xxx") is
  // unreliable in the Supabase JS client and would silently drop valid rows.
  const { data, error } = await supabase
    .from("task_overrides")
    .select("*, tasks!inner(*, courses(*))")
    .eq("custom_status", "dismissed")
    .gte("updated_at", cutoff)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  return rows.map((row) => {
    // Reconstruct the shape that mapRow expects:
    // { ...task fields, courses: {...}, task_overrides: [override] }
    const task = row.tasks as Record<string, unknown>;
    const syntheticRow: Record<string, unknown> = {
      ...task,
      task_overrides: [row],
    };
    return mapRow(syntheticRow);
  });
}

export function useHistoryTasks() {
  return useQuery({
    queryKey: ["history-tasks"],
    queryFn: fetchHistoryTasks,
  });
}
