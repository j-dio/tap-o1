"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskWithCourse } from "@/types/task";
import { TaskCard } from "@/components/task-card";

interface SortableTaskCardProps {
  task: TaskWithCourse;
}

export function SortableTaskCard({ task }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing transition-transform duration-200"
      {...attributes}
      {...listeners}
      // Override dnd-kit's default tabIndex={0} so the drag wrapper is not
      // reachable via keyboard Tab. This prevents the KeyboardSensor from
      // activating drag when the user presses Enter/Space (e.g. after closing
      // the task detail modal, focus returns to this element and a subsequent
      // Enter would incorrectly start a drag). Pointer and touch drag continue
      // to work normally via {...listeners}.
      tabIndex={-1}
    >
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}
