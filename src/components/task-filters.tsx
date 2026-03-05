"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Course } from "@/types/task";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskFiltersProps {
  courses: Course[];
}

export function TaskFilters({ courses }: TaskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSource = searchParams.get("source") ?? "all";
  const currentType = searchParams.get("type") ?? "all";
  const currentCourse = searchParams.get("course") ?? "all";
  const currentStatus = searchParams.get("status") ?? "all";
  const currentSort = searchParams.get("sort") ?? "due-date";

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || (key === "sort" && value === "due-date")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={currentSource}
        onValueChange={(v) => setFilter("source", v)}
      >
        <SelectTrigger className="h-8 w-32.5 text-xs">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          <SelectItem value="uvec">UVEC</SelectItem>
          <SelectItem value="gclassroom">Classroom</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentType} onValueChange={(v) => setFilter("type", v)}>
        <SelectTrigger className="h-8 w-32.5 text-xs">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="assignment">Assignment</SelectItem>
          <SelectItem value="quiz">Quiz</SelectItem>
          <SelectItem value="exam">Exam</SelectItem>
          <SelectItem value="event">Event</SelectItem>
          <SelectItem value="announcement">Announcement</SelectItem>
        </SelectContent>
      </Select>

      {courses.length > 0 && (
        <Select
          value={currentCourse}
          onValueChange={(v) => setFilter("course", v)}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={currentStatus}
        onValueChange={(v) => setFilter("status", v)}
      >
        <SelectTrigger className="h-8 w-32.5 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="done">Done</SelectItem>
          <SelectItem value="dismissed">Dismissed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentSort} onValueChange={(v) => setFilter("sort", v)}>
        <SelectTrigger className="h-8 w-32.5 text-xs">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="due-date">Due date</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="type">Type</SelectItem>
          <SelectItem value="title">Title</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
