"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncAllTasks, type SyncResponse } from "@/lib/actions/sync";

export function useSync() {
  const queryClient = useQueryClient();

  return useMutation<SyncResponse, Error>({
    mutationFn: async () => {
      const result = await syncAllTasks();
      // Only throw if there are errors AND zero tasks were synced
      // (i.e. complete failure, not partial success)
      if (result.synced === 0 && result.errors.length > 0) {
        const msg =
          result.errors.length === 1
            ? result.errors[0]
            : `${result.errors[0]} (+${result.errors.length - 1} more)`;
        throw new Error(msg);
      }
      return result;
    },
    onSettled: () => {
      // Always invalidate caches — even on failure, the DB state may have changed
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
