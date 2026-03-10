"use client";

import { Suspense, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import { useTasks, type TaskFilters } from "@/hooks/use-tasks";
import { useCourses } from "@/hooks/use-courses";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { TaskList } from "@/components/task-list";
import { TaskFilters as FilterBar } from "@/components/task-filters";
import { ViewToggle } from "@/components/view-toggle";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { isSameDay, cn } from "@/lib/utils";
import type { TaskWithCourse } from "@/types/task";

/* ─── Date helpers ─── */

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];

  // Leading blanks
  for (let i = 0; i < startDow; i++) {
    cells.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  // Trailing blanks to fill last week
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  // Split into weeks
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getTaskCountForDay(
  day: Date,
  tasks: TaskWithCourse[],
): TaskWithCourse[] {
  return tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
}

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ─── Main component ─── */

function CalendarContent() {
  const searchParams = useSearchParams();
  const today = useMemo(() => new Date(), []);

  const [viewDate, setViewDate] = useState<{ year: number; month: number }>(
    () => ({
      year: today.getFullYear(),
      month: today.getMonth(),
    }),
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  const { data: tasks, isLoading } = useTasks(filters);
  const { data: courses } = useCourses();
  useAutoSync();

  const grid = useMemo(
    () => getMonthGrid(viewDate.year, viewDate.month),
    [viewDate.year, viewDate.month],
  );

  const selectedTasks = useMemo(() => {
    if (!selectedDate || !tasks) return [];
    return getTaskCountForDay(selectedDate, tasks);
  }, [selectedDate, tasks]);

  const handlePrevMonth = useCallback(() => {
    setViewDate((v) => {
      const m = v.month - 1;
      return m < 0 ? { year: v.year - 1, month: 11 } : { ...v, month: m };
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewDate((v) => {
      const m = v.month + 1;
      return m > 11 ? { year: v.year + 1, month: 0 } : { ...v, month: m };
    });
  }, []);

  const handleToday = useCallback(() => {
    setViewDate({ year: today.getFullYear(), month: today.getMonth() });
    setSelectedDate(today);
  }, [today]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground text-sm">
            View tasks on their due dates.
          </p>
        </div>
      </div>

      <ViewToggle />
      <FilterBar courses={courses ?? []} />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Calendar grid */}
          <div className="flex-1">
            {/* Month navigation */}
            <div className="mb-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handlePrevMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">
                  {formatMonthYear(viewDate.year, viewDate.month)}
                </h2>
                <Button variant="ghost" size="sm" onClick={handleToday}>
                  Today
                </Button>
              </div>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleNextMonth}
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px border-b pb-2">
              {DAY_HEADERS.map((d) => (
                <div
                  key={d}
                  className="text-muted-foreground text-center text-xs font-medium"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="grid grid-cols-7 gap-px">
              {grid.map((week, wi) =>
                week.map((day, di) => {
                  if (!day) {
                    return (
                      <div
                        key={`blank-${wi}-${di}`}
                        className="min-h-16 border-b p-1"
                      />
                    );
                  }

                  const dayTasks = getTaskCountForDay(day, tasks ?? []);
                  const isToday = isSameDay(day, today);
                  const isSelected =
                    selectedDate !== null && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "hover:bg-accent/50 min-h-16 border-b p-1 text-left transition-colors",
                        isSelected && "bg-accent",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                          isToday && "bg-primary text-primary-foreground",
                          !isToday && isSelected && "bg-accent-foreground/10",
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-0.5">
                          {dayTasks.slice(0, 3).map((t) => (
                            <span
                              key={t.id}
                              className="bg-primary/10 text-primary block truncate rounded px-1 text-[10px] leading-4"
                              title={t.title}
                            >
                              {t.title}
                            </span>
                          ))}
                          {dayTasks.length > 3 && (
                            <span className="text-muted-foreground text-[10px]">
                              +{dayTasks.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                }),
              )}
            </div>
          </div>

          {/* Side panel — tasks for selected date */}
          <div className="w-full shrink-0 lg:w-80">
            {selectedDate ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </h3>
                {selectedTasks.length > 0 ? (
                  <TaskList tasks={selectedTasks} />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No tasks due this day.
                  </p>
                )}
              </div>
            ) : (
              <EmptyState
                icon={CalendarRange}
                title="Select a date"
                description="Click on a day to see tasks due that date."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-80 w-full" />
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
