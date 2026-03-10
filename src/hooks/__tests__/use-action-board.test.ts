import { describe, it, expect } from "vitest";
import { computeActionBoardBuckets } from "../use-action-board";
import type { TaskWithCourse } from "@/types/task";

// Fixed reference time: 2026-03-05 12:00:00 UTC
const NOW = new Date("2026-03-05T12:00:00Z").getTime();
const DAY = 24 * 60 * 60 * 1000;

function makeTask(overrides: Partial<TaskWithCourse>): TaskWithCourse {
  return {
    id: "t1",
    userId: "u1",
    courseId: null,
    source: "uvec",
    externalId: "e1",
    title: "Test Task",
    description: null,
    type: "assignment",
    status: "pending",
    dueDate: null,
    url: null,
    metadata: {},
    isCustom: false,
    fetchedAt: new Date(NOW).toISOString(),
    createdAt: new Date(NOW).toISOString(),
    updatedAt: new Date(NOW).toISOString(),
    course: null,
    ...overrides,
  };
}

describe("computeActionBoardBuckets", () => {
  // ---- Filtering -------------------------------------------------------

  it("skips dismissed tasks", () => {
    const task = makeTask({ status: "dismissed" });
    const result = computeActionBoardBuckets([task], NOW, 7);
    expect(result.todo).toHaveLength(0);
    expect(result.inProgress).toHaveLength(0);
    expect(result.done).toHaveLength(0);
  });

  it("places in_progress tasks in inProgress bucket", () => {
    const task = makeTask({ status: "in_progress" });
    const result = computeActionBoardBuckets([task], NOW, 7);
    expect(result.inProgress).toHaveLength(1);
    expect(result.todo).toHaveLength(0);
  });

  it("places done tasks completed within 7 days in done bucket", () => {
    const task = makeTask({
      id: "recent-done",
      status: "done",
      updatedAt: new Date(NOW - 2 * DAY).toISOString(),
    });
    const result = computeActionBoardBuckets([task], NOW, 7);
    expect(result.done).toHaveLength(1);
  });

  it("excludes done tasks completed more than 7 days ago", () => {
    const task = makeTask({
      status: "done",
      updatedAt: new Date(NOW - 8 * DAY).toISOString(),
    });
    const result = computeActionBoardBuckets([task], NOW, 7);
    expect(result.done).toHaveLength(0);
  });

  // ---- Todo window -----------------------------------------------------

  it("places pending task with no dueDate in todo", () => {
    const task = makeTask({ status: "pending", dueDate: null });
    const result = computeActionBoardBuckets([task], NOW, 7);
    expect(result.todo).toHaveLength(1);
    expect(result.todoHasMore).toBe(false);
  });

  it("places pending task due within window in todo", () => {
    const task = makeTask({
      status: "pending",
      dueDate: new Date(NOW + 3 * DAY).toISOString(),
    });
    const result = computeActionBoardBuckets([task], NOW, 7);
    expect(result.todo).toHaveLength(1);
    expect(result.todoHasMore).toBe(false);
  });

  it("excludes pending task due beyond window and sets todoHasMore", () => {
    const task = makeTask({
      status: "pending",
      dueDate: new Date(NOW + 10 * DAY).toISOString(),
    });
    const result = computeActionBoardBuckets([task], NOW, 7);
    expect(result.todo).toHaveLength(0);
    expect(result.todoHasMore).toBe(true);
  });

  it("includes task beyond 7-day window when todoWindowDays is 14", () => {
    const task = makeTask({
      status: "pending",
      dueDate: new Date(NOW + 10 * DAY).toISOString(),
    });
    const result = computeActionBoardBuckets([task], NOW, 14);
    expect(result.todo).toHaveLength(1);
    expect(result.todoHasMore).toBe(false);
  });

  it("includes overdue (past due) pending tasks regardless of window", () => {
    const task = makeTask({
      status: "pending",
      dueDate: new Date(NOW - 2 * DAY).toISOString(),
    });
    const result = computeActionBoardBuckets([task], NOW, 7);
    expect(result.todo).toHaveLength(1);
  });

  // ---- Sorting ---------------------------------------------------------

  it("sorts todo tasks by dueDate ascending (most urgent first)", () => {
    const soon = makeTask({
      id: "soon",
      status: "pending",
      dueDate: new Date(NOW + 1 * DAY).toISOString(),
    });
    const later = makeTask({
      id: "later",
      status: "pending",
      dueDate: new Date(NOW + 5 * DAY).toISOString(),
    });
    const result = computeActionBoardBuckets([later, soon], NOW, 7);
    expect(result.todo[0].id).toBe("soon");
    expect(result.todo[1].id).toBe("later");
  });

  it("places tasks with no dueDate after dated tasks in todo", () => {
    const undated = makeTask({
      id: "undated",
      status: "pending",
      dueDate: null,
    });
    const dated = makeTask({
      id: "dated",
      status: "pending",
      dueDate: new Date(NOW + 1 * DAY).toISOString(),
    });
    const result = computeActionBoardBuckets([undated, dated], NOW, 7);
    expect(result.todo[0].id).toBe("dated");
    expect(result.todo[1].id).toBe("undated");
  });

  it("sorts done tasks by updatedAt descending (most recently done first)", () => {
    const older = makeTask({
      id: "older",
      status: "done",
      updatedAt: new Date(NOW - 3 * DAY).toISOString(),
    });
    const newer = makeTask({
      id: "newer",
      status: "done",
      updatedAt: new Date(NOW - 1 * DAY).toISOString(),
    });
    const result = computeActionBoardBuckets([older, newer], NOW, 7);
    expect(result.done[0].id).toBe("newer");
    expect(result.done[1].id).toBe("older");
  });

  // ---- Mixed buckets ---------------------------------------------------

  it("correctly distributes a mixed task list into all three buckets", () => {
    const tasks = [
      makeTask({
        id: "todo",
        status: "pending",
        dueDate: new Date(NOW + 1 * DAY).toISOString(),
      }),
      makeTask({ id: "wip", status: "in_progress" }),
      makeTask({
        id: "done",
        status: "done",
        updatedAt: new Date(NOW - 1 * DAY).toISOString(),
      }),
      makeTask({ id: "dismissed", status: "dismissed" }),
      makeTask({
        id: "far",
        status: "pending",
        dueDate: new Date(NOW + 20 * DAY).toISOString(),
      }),
    ];
    const result = computeActionBoardBuckets(tasks, NOW, 7);
    expect(result.todo).toHaveLength(1);
    expect(result.inProgress).toHaveLength(1);
    expect(result.done).toHaveLength(1);
    expect(result.todoHasMore).toBe(true);
  });
});
