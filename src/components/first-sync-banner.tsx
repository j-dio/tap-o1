"use client";

import { useState, useMemo, useEffect } from "react";
import { X, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPastDueCandidates,
  FIRST_SYNC_HANDLED_KEY,
  FIRST_SYNC_BANNER_THRESHOLD,
} from "@/lib/first-sync-heuristic";
import type { TaskWithCourse } from "@/types/task";

type CutoffDays = 7 | 14 | 30;

interface FirstSyncBannerProps {
  tasks: TaskWithCourse[];
  onArchive: (taskIds: string[]) => void;
  isArchiving?: boolean;
}

export function FirstSyncBanner({
  tasks,
  onArchive,
  isArchiving = false,
}: FirstSyncBannerProps) {
  const [cutoffDays, setCutoffDays] = useState<CutoffDays>(7);
  // Visibility is determined once after mount using the widest cutoff (7d).
  // Subsequent dropdown changes affect the displayed count but never dismiss the banner.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Stop evaluating once we've already decided to show (or after dismissal,
    // localStorage will be set and the second guard handles it).
    if (visible) return;
    if (localStorage.getItem(FIRST_SYNC_HANDLED_KEY) !== null) return;
    // Threshold is always checked at the widest cutoff (7d). This runs each
    // time `tasks` changes (empty → loaded), so the banner appears as soon
    // as enough stale UVEC tasks are available.
    if (getPastDueCandidates(tasks, 7).length > FIRST_SYNC_BANNER_THRESHOLD) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, [tasks, visible]);

  const candidates = useMemo(
    () => getPastDueCandidates(tasks, cutoffDays),
    [tasks, cutoffDays],
  );

  if (!visible) return null;

  function markHandled() {
    localStorage.setItem(FIRST_SYNC_HANDLED_KEY, "true");
    setVisible(false);
  }

  function handleArchive() {
    onArchive(candidates.map((t) => t.id));
    markHandled();
  }

  return (
    <div className="bg-primary/10 border-primary/20 animate-in slide-in-from-top-2 duration-300 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <PartyPopper className="text-primary mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">First sync complete!</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Found{" "}
              <span className="text-foreground font-medium">
                {candidates.length} UVEC tasks
              </span>{" "}
              overdue by at least{" "}
              <select
                value={cutoffDays}
                onChange={(e) =>
                  setCutoffDays(Number(e.target.value) as CutoffDays)
                }
                className="bg-background border-input text-foreground cursor-pointer rounded border px-1.5 py-0.5 text-sm font-medium"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
              . These are likely already submitted.
            </p>
          </div>
        </div>
        <button
          onClick={markHandled}
          className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={handleArchive} disabled={isArchiving}>
          Archive {candidates.length} tasks
        </Button>
        <Button size="sm" variant="ghost" onClick={markHandled}>
          I&apos;ll sort them myself
        </Button>
      </div>
    </div>
  );
}
