import { describe, it, expect } from "vitest";
import {
  getPastDueCandidates,
  FIRST_SYNC_BANNER_THRESHOLD,
} from "@/lib/first-sync-heuristic";
import type { TaskWithCourse } from "@/types/task";

function makeTask(overrides: Partial<TaskWithCourse> = {}): TaskWithCourse {
  return {
    id: "t1",
    userId: "u1",
    courseId: null,
    source: "uvec",
    externalId: "ext-1",
    title: "Test Task",
    description: null,
    type: "assignment",
    status: "pending",
    dueDate: null,
    url: null,
    metadata: {},
    isCustom: false,
    fetchedAt: "",
    createdAt: "",
    updatedAt: "",
    priority: null,
    notes: null,
    displayStatus: "pending",
    course: null,
    ...overrides,
  };
}

/** ISO date string N days in the past */
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString();

describe("getPastDueCandidates", () => {
  it("includes a pending UVEC task older than the cutoff", () => {
    const tasks = [makeTask({ dueDate: daysAgo(10) })];
    expect(getPastDueCandidates(tasks, 7)).toHaveLength(1);
  });

  it("excludes a task within the cutoff window", () => {
    const tasks = [makeTask({ dueDate: daysAgo(3) })];
    expect(getPastDueCandidates(tasks, 7)).toHaveLength(0);
  });

  it("excludes gclassroom tasks", () => {
    const tasks = [makeTask({ source: "gclassroom", dueDate: daysAgo(10) })];
    expect(getPastDueCandidates(tasks, 7)).toHaveLength(0);
  });

  it("excludes custom tasks regardless of source", () => {
    const tasks = [makeTask({ isCustom: true, dueDate: daysAgo(10) })];
    expect(getPastDueCandidates(tasks, 7)).toHaveLength(0);
  });

  it("excludes tasks with a null dueDate", () => {
    const tasks = [makeTask({ dueDate: null })];
    expect(getPastDueCandidates(tasks, 7)).toHaveLength(0);
  });

  it("excludes non-pending tasks", () => {
    const tasks = [
      makeTask({ status: "done", dueDate: daysAgo(10) }),
      makeTask({ status: "in_progress", dueDate: daysAgo(10) }),
      makeTask({ status: "dismissed", dueDate: daysAgo(10) }),
    ];
    expect(getPastDueCandidates(tasks, 7)).toHaveLength(0);
  });

  it("larger cutoff = narrower net (cutoff=7 captures what cutoff=14 misses)", () => {
    // A task 10 days old: older than 7d ✓, but newer than 14d ✗
    const tasks = [makeTask({ dueDate: daysAgo(10) })];
    expect(getPastDueCandidates(tasks, 7)).toHaveLength(1);
    expect(getPastDueCandidates(tasks, 14)).toHaveLength(0);
  });

  it("returns empty array for an empty task list", () => {
    expect(getPastDueCandidates([], 7)).toHaveLength(0);
  });
});

describe("FIRST_SYNC_BANNER_THRESHOLD", () => {
  it("is 3 — banner only shows when candidates exceed this count", () => {
    expect(FIRST_SYNC_BANNER_THRESHOLD).toBe(3);
  });
});
