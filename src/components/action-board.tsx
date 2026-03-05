"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { TaskWithCourse, ActionBoardColumn } from "@/types/task";
import { useTaskActions } from "@/hooks/use-task-actions";
import { ActionBoardColumn as Column } from "@/components/action-board-column";
import { TaskCard } from "@/components/task-card";

interface ActionBoardProps {
  todoTasks: TaskWithCourse[];
  inProgressTasks: TaskWithCourse[];
  doneTasks: TaskWithCourse[];
}

const statusMap: Record<ActionBoardColumn, "pending" | "in_progress" | "done"> =
  {
    todo: "pending",
    in_progress: "in_progress",
    done: "done",
  };

export function ActionBoard({
  todoTasks,
  inProgressTasks,
  doneTasks,
}: ActionBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithCourse | null>(null);
  const { setStatus } = useTaskActions();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const allTasks = [...todoTasks, ...inProgressTasks, ...doneTasks];

  const findTask = useCallback(
    (id: string): TaskWithCourse | undefined => {
      return allTasks.find((t) => t.id === id);
    },
    [allTasks],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = findTask(event.active.id as string);
      if (task) setActiveTask(task);
    },
    [findTask],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;

      if (!over) return;

      const taskId = active.id as string;
      const targetColumn = over.id as ActionBoardColumn;
      const task = findTask(taskId);

      if (!task) return;

      const newStatus = statusMap[targetColumn];
      if (!newStatus) return;

      // Skip if status unchanged
      if (task.status === newStatus) return;
      if (
        task.status === "pending" &&
        newStatus === "pending" &&
        task.displayStatus === "overdue"
      )
        return;

      setStatus.mutate({ taskId, status: newStatus });
    },
    [findTask, setStatus],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0">
        <Column
          id="todo"
          title="To Do"
          tasks={todoTasks}
          accentClass="text-info"
        />
        <Column
          id="in_progress"
          title="In Progress"
          tasks={inProgressTasks}
          accentClass="text-warning"
        />
        <Column
          id="done"
          title="Done"
          tasks={doneTasks}
          accentClass="text-success"
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
