import { describe, it, expect } from "vitest";
import { pickUpNextTask } from "../use-up-next";
import type { TaskWithCourse } from "@/types/task";

const NOW = new Date("2026-04-03T12:00:00Z").getTime();
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

describe("pickUpNextTask", () => {
  it("returns null when the only pending task is outside the todo window", () => {
    const far = makeTask({
      id: "far",
      dueDate: new Date(NOW + 48 * DAY).toISOString(),
    });
    expect(pickUpNextTask([far], NOW, 14)).toBeNull();
  });

  it("selects pending task within the todo window", () => {
    const near = makeTask({
      id: "near",
      dueDate: new Date(NOW + 7 * DAY).toISOString(),
    });
    expect(pickUpNextTask([near], NOW, 14)?.id).toBe("near");
  });

  it("still surfaces in_progress tasks with a far-future due date", () => {
    const ip = makeTask({
      id: "ip",
      status: "in_progress",
      dueDate: new Date(NOW + 48 * DAY).toISOString(),
    });
    expect(pickUpNextTask([ip], NOW, 14)?.id).toBe("ip");
  });
});
