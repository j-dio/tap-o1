"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncAllTasks, type SyncResponse } from "@/lib/actions/sync";

export function useSync() {
  const queryClient = useQueryClient();

  return useMutation<SyncResponse, Error>({
    mutationFn: async () => {
      const result = await syncAllTasks();
      if (result.synced === 0 && result.errors.length > 0) {
        throw new Error(result.errors.join(" "));
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
