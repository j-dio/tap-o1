"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncAllTasks, type SyncResponse } from "@/lib/actions/sync";
import { toast } from "sonner";

/** Minimum interval between syncs (5 minutes) */
const SYNC_COOLDOWN_MS = 5 * 60 * 1000;
/** Auto-sync threshold (1 hour since last sync) */
export const AUTO_SYNC_STALE_MS = 60 * 60 * 1000;

let lastSyncAtMs = 0;

export function getLastSyncAt(): number {
  return lastSyncAtMs;
}

export function timeSinceLastSync(): number {
  if (lastSyncAtMs === 0) return Infinity;
  return Date.now() - lastSyncAtMs;
}

export function isSyncOnCooldown(): boolean {
  return timeSinceLastSync() < SYNC_COOLDOWN_MS;
}

export function cooldownRemainingMs(): number {
  if (!isSyncOnCooldown()) return 0;
  return SYNC_COOLDOWN_MS - timeSinceLastSync();
}

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
      // Record successful sync time
      lastSyncAtMs = Date.now();
      return result;
    },
    onSettled: (_data, error) => {
      // Always invalidate caches — even on failure, the DB state may have changed
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });

      // Surface toast notifications
      if (error) {
        toast.error("Sync failed", { description: error.message });
      } else if (_data) {
        const { errors: warnings } = _data;
        if (warnings.length === 0) {
          toast.success("Synced successfully");
        } else {
          toast.warning("Synced with warnings", { description: warnings[0] });
        }
      }
    },
  });
}
