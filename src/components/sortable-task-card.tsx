"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskWithCourse } from "@/types/task";
import { TaskCard } from "@/components/task-card";

interface SortableTaskCardProps {
  task: TaskWithCourse;
}

export function SortableTaskCard({ task }: SortableTaskCardProps) {
  // Track whether the task detail modal is open so we can suspend drag
  // listeners while it is — otherwise touch events inside the modal bleed
  // through to the dnd-kit sensor and trigger unwanted drags.
  const [modalOpen, setModalOpen] = useState(false);

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
      className={modalOpen ? "transition-transform duration-200" : "cursor-grab active:cursor-grabbing transition-transform duration-200"}
      {...attributes}
      // Listeners are suspended while the modal is open so that holds/touches
      // inside the dialog don't activate the drag sensor on the card behind it.
      {...(modalOpen ? {} : listeners)}
      // Override dnd-kit's default tabIndex={0} so the drag wrapper is not
      // reachable via keyboard Tab. This prevents the KeyboardSensor from
      // activating drag when the user presses Enter/Space (e.g. after closing
      // the task detail modal, focus returns to this element and a subsequent
      // Enter would incorrectly start a drag). Pointer and touch drag continue
      // to work normally via {...listeners}.
      tabIndex={-1}
    >
      <TaskCard task={task} isDragging={isDragging} onModalOpenChange={setModalOpen} />
    </div>
  );
}
