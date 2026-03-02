"use client";

import { useMemo } from "react";
import { useState } from "react";
import type { TaskWithCourse } from "@/types/task";
import { useTaskActions } from "@/hooks/use-task-actions";
import { Button } from "@/components/ui/button";
import type { TaskPriority } from "@/types/task";
import { ExternalLink } from "lucide-react";

interface TaskActionsProps {
  task: TaskWithCourse;
}

export function TaskActions({ task }: TaskActionsProps) {
  const { setStatus, setPriority, setNotes } = useTaskActions();
  const [notesDraft, setNotesDraft] = useState(task.notes ?? "");

  const isSavingStatus = useMemo(
    () => setStatus.isPending && setStatus.variables?.taskId === task.id,
    [setStatus.isPending, setStatus.variables?.taskId, task.id],
  );

  const isSavingPriority = useMemo(
    () => setPriority.isPending && setPriority.variables?.taskId === task.id,
    [setPriority.isPending, setPriority.variables?.taskId, task.id],
  );

  const isSavingNotes = useMemo(
    () => setNotes.isPending && setNotes.variables?.taskId === task.id,
    [setNotes.isPending, setNotes.variables?.taskId, task.id],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={task.status === "done" ? "default" : "outline"}
          disabled={isSavingStatus}
          onClick={() => {
            setStatus.mutate({ taskId: task.id, status: "done" });
          }}
        >
          Mark done
        </Button>

        <Button
          type="button"
          size="sm"
          variant={task.status === "dismissed" ? "secondary" : "outline"}
          disabled={isSavingStatus}
          onClick={() => {
            setStatus.mutate({ taskId: task.id, status: "dismissed" });
          }}
        >
          Dismiss
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isSavingStatus}
          onClick={() => {
            setStatus.mutate({ taskId: task.id, status: "pending" });
          }}
        >
          Reset
        </Button>

        {task.url && (
          <Button type="button" size="sm" variant="outline" asChild>
            <a href={task.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Open in {task.source === "gclassroom" ? "Classroom" : "UVEC"}
            </a>
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-muted-foreground text-xs font-medium">
          Priority
        </label>
        <select
          className="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
          value={task.priority ?? "none"}
          onChange={(event) => {
            const next = event.target.value;
            setPriority.mutate({
              taskId: task.id,
              priority: next === "none" ? null : (next as TaskPriority),
            });
          }}
          disabled={isSavingPriority}
        >
          <option value="none">No priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-muted-foreground text-xs font-medium">
          Personal notes
        </label>
        <textarea
          className="border-input bg-background min-h-20 w-full rounded-md border p-2 text-sm"
          value={notesDraft}
          onChange={(event) => {
            setNotesDraft(event.target.value);
          }}
          placeholder="Add your notes for this task..."
        />
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSavingNotes}
            onClick={() => {
              const trimmedNotes = notesDraft.trim();
              setNotes.mutate({
                taskId: task.id,
                notes: trimmedNotes || null,
              });
            }}
          >
            Save notes
          </Button>
        </div>
      </div>
    </div>
  );
}
