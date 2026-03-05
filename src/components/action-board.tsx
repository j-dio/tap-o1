"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
  type CollisionDescriptor,
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
  todoWindowDays: number;
  onShowMoreTodo?: () => void;
  onShowLessTodo?: () => void;
}

const statusMap: Record<ActionBoardColumn, "pending" | "in_progress" | "done"> =
  {
    todo: "pending",
    in_progress: "in_progress",
    done: "done",
  };

const COLUMN_IDS = new Set<ActionBoardColumn>(["todo", "in_progress", "done"]);

/**
 * Custom collision detection for the kanban board.
 *
 * Strategy:
 * 1. Use pointerWithin — checks what the *mouse pointer* is physically over,
 *    not which corners of the dragged card are geometrically nearest. This
 *    prevents a card in an adjacent column from "stealing" the collision when
 *    dragging across columns (the closestCorners bug).
 * 2. Among the detected collisions, prefer column container IDs over task card
 *    IDs so dropping onto an occupied column reliably resolves to the column.
 * 3. Fall back to rectIntersection when the pointer isn't within any droppable
 *    (e.g. dragging in a gap between columns).
 */
const kanbanCollision: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
    const columnHit = pointerCollisions.find((c: CollisionDescriptor) =>
      COLUMN_IDS.has(c.id as ActionBoardColumn),
    );
    return columnHit ? [columnHit] : pointerCollisions;
  }

  return rectIntersection(args);
};

export function ActionBoard({
  todoTasks,
  inProgressTasks,
  doneTasks,
  todoWindowDays,
  onShowMoreTodo,
  onShowLessTodo,
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
      const task = findTask(taskId);
      if (!task) return;

      // over.id can be either a column id or a task id (when dropped on top of
      // a card inside a column). Resolve to the column in both cases.
      let targetColumn: ActionBoardColumn;
      if (COLUMN_IDS.has(over.id as ActionBoardColumn)) {
        targetColumn = over.id as ActionBoardColumn;
      } else {
        const overTask = findTask(over.id as string);
        if (!overTask) return;
        if (overTask.status === "done") targetColumn = "done";
        else if (overTask.status === "in_progress")
          targetColumn = "in_progress";
        else targetColumn = "todo";
      }

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
      collisionDetection={kanbanCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0">
        <Column
          id="todo"
          title="To Do"
          tasks={todoTasks}
          accentClass="text-info"
          onShowMore={onShowMoreTodo}
          onShowLess={onShowLessTodo}
          todoWindowDays={todoWindowDays}
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
