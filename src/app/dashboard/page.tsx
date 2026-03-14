"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

const MAX_TODO_WINDOW_DAYS = 56; // 8 weeks — matches the 60-day fetch window
const MAX_DONE_WINDOW_DAYS = 28; // 4 weeks
const SESSION_KEY_TODO = "todoWindowDays";
const SESSION_KEY_DONE = "doneWindowDays";
const SESSION_KEY_INPROGRESS = "inProgressLimit";

function readWindowDays(): number {
  if (typeof window === "undefined") return 7;
  const stored = sessionStorage.getItem(SESSION_KEY_TODO);
  const parsed = stored ? parseInt(stored, 10) : NaN;
  return isNaN(parsed) ? 7 : parsed;
}

function readDoneWindowDays(): number {
  if (typeof window === "undefined") return 7;
  const stored = sessionStorage.getItem(SESSION_KEY_DONE);
  const parsed = stored ? parseInt(stored, 10) : NaN;
  return isNaN(parsed) ? 7 : parsed;
}

function readInProgressLimit(): number {
  if (typeof window === "undefined") return 5;
  const stored = sessionStorage.getItem(SESSION_KEY_INPROGRESS);
  const parsed = stored ? parseInt(stored, 10) : NaN;
  return isNaN(parsed) ? 5 : parsed;
}
import { useTasks, type TaskFilters } from "@/hooks/use-tasks";
import { useCourses } from "@/hooks/use-courses";
import { useSync } from "@/hooks/use-sync";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useActionBoard } from "@/hooks/use-action-board";
import { useUpNext } from "@/hooks/use-up-next";
import { useFocusMode } from "@/hooks/use-focus-mode";
import { ActionBoard } from "@/components/action-board";
import { ErrorBoundary } from "@/components/error-boundary";
import { TaskFilters as FilterBar } from "@/components/task-filters";
import { TaskList } from "@/components/task-list";
import { UpNextWidget } from "@/components/up-next-widget";
import { FocusModeToggle } from "@/components/focus-mode-toggle";
import { SyncButton } from "@/components/sync-button";
import { EmptyState } from "@/components/empty-state";
import { ViewToggle } from "@/components/view-toggle";
import { CustomTaskModal } from "@/components/custom-task-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const { mutate: sync, isPending: isSyncing } = useSync();
  const [focusMode, setFocusMode] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const filters: TaskFilters = {};
  const source = searchParams.get("source");
  const type = searchParams.get("type");
  const course = searchParams.get("course");
  const status = searchParams.get("status");
  if (source && source !== "all")
    filters.source = source as TaskFilters["source"];
  if (type && type !== "all") filters.type = type as TaskFilters["type"];
  if (course && course !== "all") filters.courseId = course;
  if (status && status !== "all")
    filters.status = status as TaskFilters["status"];

  const { data: tasks, isLoading: tasksLoading } = useTasks(filters);
  const { data: courses } = useCourses();
  useAutoSync();
  const { bind, pullDistance, isReady } = usePullToRefresh({
    onRefresh: async () => {
      sync();
    },
    disabled: isSyncing,
  });

  const [todoWindowDays, setTodoWindowDays] = useState<number>(readWindowDays);
  const handleShowMoreTodo = useCallback(() => {
    setTodoWindowDays((d) => {
      const next = Math.min(d + 7, MAX_TODO_WINDOW_DAYS);
      sessionStorage.setItem(SESSION_KEY_TODO, String(next));
      return next;
    });
  }, []);
  const handleShowLessTodo = useCallback(() => {
    setTodoWindowDays((d) => {
      const next = Math.max(d - 7, 7);
      next === 7
        ? sessionStorage.removeItem(SESSION_KEY_TODO)
        : sessionStorage.setItem(SESSION_KEY_TODO, String(next));
      return next;
    });
  }, []);

  const [doneWindowDays, setDoneWindowDays] =
    useState<number>(readDoneWindowDays);
  const handleShowMoreDone = useCallback(() => {
    setDoneWindowDays((d) => {
      const next = Math.min(d + 7, MAX_DONE_WINDOW_DAYS);
      sessionStorage.setItem(SESSION_KEY_DONE, String(next));
      return next;
    });
  }, []);
  const handleShowLessDone = useCallback(() => {
    setDoneWindowDays((d) => {
      const next = Math.max(d - 7, 7);
      next === 7
        ? sessionStorage.removeItem(SESSION_KEY_DONE)
        : sessionStorage.setItem(SESSION_KEY_DONE, String(next));
      return next;
    });
  }, []);

  const [inProgressLimit, setInProgressLimit] =
    useState<number>(readInProgressLimit);
  const handleShowMoreInProgress = useCallback(() => {
    setInProgressLimit((l) => {
      const next = l + 5;
      sessionStorage.setItem(SESSION_KEY_INPROGRESS, String(next));
      return next;
    });
  }, []);
  const handleShowLessInProgress = useCallback(() => {
    setInProgressLimit((l) => {
      const next = Math.max(l - 5, 5);
      next === 5
        ? sessionStorage.removeItem(SESSION_KEY_INPROGRESS)
        : sessionStorage.setItem(SESSION_KEY_INPROGRESS, String(next));
      return next;
    });
  }, []);

  const { todo, inProgress, done, todoHasMore, doneHasMore, inProgressHasMore } =
    useActionBoard(tasks ?? [], todoWindowDays, doneWindowDays, inProgressLimit);
  const upNextTask = useUpNext(tasks ?? []);
  const focusTasks = useFocusMode(tasks ?? []);

  return (
    <div className="flex flex-col gap-6" {...bind}>
      <div className="lg:hidden" aria-live="polite">
        <p className="text-muted-foreground text-center text-xs">
          {isSyncing
            ? "Syncing..."
            : pullDistance > 0
              ? isReady
                ? "Release to sync"
                : "Pull to refresh"
              : ""}
        </p>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {focusMode
              ? "Tasks due within 24 hours."
              : "Manage your tasks by workflow status."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setNewTaskOpen(true)}>
            <Plus className="mr-1 size-4" />
            New task
          </Button>
          <FocusModeToggle
            enabled={focusMode}
            onToggle={() => setFocusMode(!focusMode)}
          />
          <div className="hidden lg:block">
            <SyncButton />
          </div>
        </div>
      </div>

      <ViewToggle />

      {/* Filters */}
      <FilterBar courses={courses ?? []} />

      {/* Content */}
      {tasksLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : tasks && tasks.length > 0 ? (
        focusMode ? (
          <div className="space-y-4">
            {focusTasks.length > 0 ? (
              <TaskList tasks={focusTasks} />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No urgent tasks"
                description="You have no tasks due within the next 24 hours."
              />
            )}
          </div>
        ) : (
          <>
            <UpNextWidget task={upNextTask} />
            <ErrorBoundary>
              <ActionBoard
                todoTasks={todo}
                inProgressTasks={inProgress}
                doneTasks={done}
                todoWindowDays={todoWindowDays}
                doneWindowDays={doneWindowDays}
                inProgressLimit={inProgressLimit}
                onShowMoreTodo={todoHasMore ? handleShowMoreTodo : undefined}
                onShowLessTodo={
                  todoWindowDays > 7 ? handleShowLessTodo : undefined
                }
                onShowMoreDone={doneHasMore ? handleShowMoreDone : undefined}
                onShowLessDone={
                  doneWindowDays > 7 ? handleShowLessDone : undefined
                }
                onShowMoreInProgress={
                  inProgressHasMore ? handleShowMoreInProgress : undefined
                }
                onShowLessInProgress={
                  inProgressLimit > 5 ? handleShowLessInProgress : undefined
                }
              />
            </ErrorBoundary>
          </>
        )
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No tasks yet"
          description="Connect UVEC or Google Classroom, then sync to pull in your tasks."
          action={{ label: "Sync now", onClick: () => sync() }}
        />
      )}

      <CustomTaskModal open={newTaskOpen} onOpenChange={setNewTaskOpen} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}
