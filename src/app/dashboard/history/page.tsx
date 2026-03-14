"use client";

import { Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { History } from "lucide-react";
import { useHistoryTasks } from "@/hooks/use-history-tasks";
import { useTaskActions } from "@/hooks/use-task-actions";
import { EmptyState } from "@/components/empty-state";
import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDate } from "@/lib/utils";

function HistoryContent() {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useHistoryTasks();
  const { setStatus } = useTaskActions();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground text-sm">
          Tasks dismissed in the last 24 hours.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState
          icon={History}
          title="No recently dismissed tasks"
          description="Tasks you dismiss will appear here for 24 hours."
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-card flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{task.title}</p>
                <p className="text-muted-foreground text-xs">
                  {task.course?.name ?? "No course"}
                  {task.dueDate
                    ? ` · Due ${new Date(task.dueDate).toLocaleDateString()}`
                    : ""}
                  {" · dismissed "}
                  {formatRelativeDate(new Date(task.updatedAt))}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setStatus.mutate(
                    { taskId: task.id, status: "pending" },
                    {
                      onSuccess: () =>
                        queryClient.invalidateQueries({
                          queryKey: ["history-tasks"],
                        }),
                    },
                  )
                }
                disabled={setStatus.isPending}
              >
                Restore
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            <Skeleton className="h-10 w-48" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        }
      >
        <HistoryContent />
      </Suspense>
    </ErrorBoundary>
  );
}
