"use client";

import { useState, useEffect, useCallback } from "react";
import type { TaskWithCourse, TaskType, TaskPriority } from "@/types/task";
import { useCourses } from "@/hooks/use-courses";
import { useTaskActions } from "@/hooks/use-task-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "assignment", label: "Assignment" },
  { value: "quiz", label: "Quiz" },
  { value: "exam", label: "Exam" },
  { value: "event", label: "Event" },
  { value: "announcement", label: "Announcement" },
];

const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

interface CustomTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, opens in edit mode for this custom task. */
  task?: TaskWithCourse;
}

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // Format as YYYY-MM-DDTHH:MM for datetime-local input
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetimeValue(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export function CustomTaskModal({
  open,
  onOpenChange,
  task,
}: CustomTaskModalProps) {
  const isEdit = !!task?.isCustom;
  const { data: courses } = useCourses();
  const { createTask, editTask } = useTaskActions();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState<TaskType>("assignment");
  const [priority, setPriority] = useState<TaskPriority | "none">("none");
  const [courseId, setCourseId] = useState<string>("none");

  // Reset form when dialog opens / task changes
  useEffect(() => {
    if (!open) return;
    if (isEdit && task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setDueDate(toLocalDatetimeValue(task.dueDate));
      setType(task.type);
      setPriority(task.priority ?? "none");
      setCourseId(task.courseId ?? "none");
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setType("assignment");
      setPriority("none");
      setCourseId("none");
    }
  }, [open, isEdit, task]);

  const isPending = createTask.isPending || editTask.isPending;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: fromLocalDatetimeValue(dueDate),
        type,
        priority: priority === "none" ? undefined : priority,
        courseId: courseId === "none" ? undefined : courseId,
      };

      if (isEdit && task) {
        editTask.mutate(
          {
            id: task.id,
            input: {
              ...payload,
              description: payload.description ?? null,
              dueDate: payload.dueDate ?? null,
              priority: (payload.priority ?? null) as TaskPriority | null,
              courseId: (payload.courseId ?? null) as string | null,
            },
          },
          { onSuccess: () => onOpenChange(false) },
        );
      } else {
        createTask.mutate(payload, {
          onSuccess: () => onOpenChange(false),
        });
      }
    },
    [
      title,
      description,
      dueDate,
      type,
      priority,
      courseId,
      isEdit,
      task,
      createTask,
      editTask,
      onOpenChange,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="ct-title" className="text-muted-foreground text-xs font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="ct-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
              autoFocus
            />
          </div>

          {/* Due date/time */}
          <div className="space-y-1.5">
            <label htmlFor="ct-due" className="text-muted-foreground text-xs font-medium">
              Due date &amp; time
            </label>
            <Input
              id="ct-due"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Type + Priority row */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as TaskType)}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">Priority</label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority | "none")}
              >
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Course */}
          {courses && courses.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-medium">Course</label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No course (personal)</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="ct-desc" className="text-muted-foreground text-xs font-medium">
              Description
            </label>
            <textarea
              id="ct-desc"
              className="border-input bg-background min-h-20 w-full rounded-md border p-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or description..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Create task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
