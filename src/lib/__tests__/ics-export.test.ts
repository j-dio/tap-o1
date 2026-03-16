import { describe, it, expect } from "vitest";
import { generateIcsContent } from "@/lib/ics-export";
import type { TaskWithCourse } from "@/types/task";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(
  overrides: Partial<TaskWithCourse> = {},
): TaskWithCourse {
  const base: TaskWithCourse = {
    id: "task-001",
    userId: "user-001",
    courseId: "course-001",
    source: "uvec",
    externalId: "ext-001",
    title: "Test Assignment",
    description: null,
    type: "assignment",
    status: "pending",
    displayStatus: "pending",
    dueDate: "2026-04-15T00:00:00.000Z",
    url: null,
    metadata: {},
    isCustom: false,
    fetchedAt: "2026-03-16T00:00:00.000Z",
    createdAt: "2026-03-16T00:00:00.000Z",
    updatedAt: "2026-03-16T00:00:00.000Z",
    course: {
      id: "course-001",
      userId: "user-001",
      source: "uvec",
      externalId: "course-ext-001",
      name: "ENGL 101",
      shortName: null,
      instructor: null,
      color: null,
      isArchived: false,
      createdAt: "2026-03-16T00:00:00.000Z",
    },
    priority: null,
    notes: null,
  };
  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// Tests: null return cases (ICS-05)
// ---------------------------------------------------------------------------

describe("generateIcsContent — null cases (ICS-05)", () => {
  it("returns null for an empty array", () => {
    expect(generateIcsContent([])).toBeNull();
  });

  it("returns null when all tasks are done", () => {
    const tasks = [
      makeTask({ status: "done", displayStatus: "done" }),
      makeTask({ id: "task-002", status: "done", displayStatus: "done" }),
    ];
    expect(generateIcsContent(tasks)).toBeNull();
  });

  it("returns null when all tasks are dismissed", () => {
    const tasks = [
      makeTask({ status: "dismissed", displayStatus: "dismissed" }),
    ];
    expect(generateIcsContent(tasks)).toBeNull();
  });

  it("returns null when all tasks have dueDate === null", () => {
    const tasks = [
      makeTask({ dueDate: null }),
      makeTask({ id: "task-002", dueDate: null }),
    ];
    expect(generateIcsContent(tasks)).toBeNull();
  });

  it("returns null when pending tasks all have dueDate === null", () => {
    const tasks = [makeTask({ status: "pending", displayStatus: "pending", dueDate: null })];
    expect(generateIcsContent(tasks)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: successful export cases (ICS-01)
// ---------------------------------------------------------------------------

describe("generateIcsContent — successful export (ICS-01)", () => {
  it("returns IcsExportResult for a pending task with dueDate", () => {
    const tasks = [makeTask({ status: "pending", displayStatus: "pending" })];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).toBeTruthy();
    expect(result!.count).toBe(1);
  });

  it("returns IcsExportResult for an in_progress task with dueDate", () => {
    const tasks = [makeTask({ status: "in_progress", displayStatus: "in_progress" })];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.count).toBe(1);
  });

  it("returns IcsExportResult for an overdue task (displayStatus=overdue)", () => {
    const tasks = [
      makeTask({
        status: "pending",
        displayStatus: "overdue",
        dueDate: "2026-01-01T00:00:00.000Z",
      }),
    ];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.count).toBe(1);
  });

  it("count matches the number of exported events", () => {
    const tasks = [
      makeTask({ id: "t1", displayStatus: "pending" }),
      makeTask({ id: "t2", displayStatus: "overdue", dueDate: "2026-01-01T00:00:00.000Z" }),
      makeTask({ id: "t3", status: "in_progress", displayStatus: "in_progress" }),
      makeTask({ id: "t4", status: "done", displayStatus: "done" }), // excluded
    ];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.count).toBe(3);
  });

  it("silently excludes done tasks and only exports exportable ones", () => {
    const tasks = [
      makeTask({ id: "t1", displayStatus: "pending" }),
      makeTask({ id: "t2", status: "done", displayStatus: "done" }),
      makeTask({ id: "t3", dueDate: null }), // excluded: no dueDate
    ];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tests: ICS string format (ICS-02)
// ---------------------------------------------------------------------------

describe("generateIcsContent — ICS string format (ICS-02)", () => {
  it("ICS string contains DTSTART;VALUE=DATE: (no time component)", () => {
    const tasks = [makeTask()];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).toContain("DTSTART;VALUE=DATE:");
  });

  it("ICS string does not contain floating DTSTART (with time)", () => {
    const tasks = [makeTask()];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    // Should NOT have DTSTART:20... (datetime format with no VALUE=DATE)
    expect(result!.content).not.toMatch(/^DTSTART:\d{8}T/m);
  });

  it("ICS string contains BEGIN:VCALENDAR and END:VCALENDAR", () => {
    const tasks = [makeTask()];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).toContain("BEGIN:VCALENDAR");
    expect(result!.content).toContain("END:VCALENDAR");
  });

  it("ICS string date matches the task dueDate (April 15, 2026 → 20260415)", () => {
    const tasks = [makeTask({ dueDate: "2026-04-15T00:00:00.000Z" })];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).toContain("DTSTART;VALUE=DATE:20260415");
  });
});

// ---------------------------------------------------------------------------
// Tests: UID pattern (ICS-03)
// ---------------------------------------------------------------------------

describe("generateIcsContent — UID format (ICS-03)", () => {
  it("UID in ICS string matches {source}-{id}@tapo1.app for uvec task", () => {
    const tasks = [makeTask({ id: "task-abc", source: "uvec" })];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).toContain("UID:uvec-task-abc@tapo1.app");
  });

  it("UID in ICS string matches {source}-{id}@tapo1.app for gclassroom task", () => {
    const tasks = [makeTask({ id: "gc-999", source: "gclassroom" })];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).toContain("UID:gclassroom-gc-999@tapo1.app");
  });

  it("UID in ICS string matches {source}-{id}@tapo1.app for custom task", () => {
    const tasks = [makeTask({ id: "custom-xyz", source: "custom" })];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).toContain("UID:custom-custom-xyz@tapo1.app");
  });
});

// ---------------------------------------------------------------------------
// Tests: DESCRIPTION field
// ---------------------------------------------------------------------------

describe("generateIcsContent — DESCRIPTION field", () => {
  it("DESCRIPTION contains Course name and source label", () => {
    const tasks = [
      makeTask({
        source: "uvec",
        course: {
          id: "c1",
          userId: "u1",
          source: "uvec",
          externalId: "ext-c1",
          name: "Mathematics 101",
          shortName: null,
          instructor: null,
          color: null,
          isArchived: false,
          createdAt: "2026-03-16T00:00:00.000Z",
        },
      }),
    ];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).toContain("Course: Mathematics 101 (UVEC)");
  });

  it("DESCRIPTION uses 'Google Classroom' label for gclassroom source", () => {
    const tasks = [makeTask({ source: "gclassroom" })];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).toContain("(Google Classroom)");
  });

  it("DESCRIPTION uses 'Custom' label for custom source", () => {
    const tasks = [makeTask({ source: "custom" })];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).toContain("(Custom)");
  });

  it("DESCRIPTION uses 'No course' when task.course is null", () => {
    const tasks = [makeTask({ course: null })];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).toContain("Course: No course");
  });

  it("DESCRIPTION omits Open: line when task.url is null", () => {
    const tasks = [makeTask({ url: null })];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).not.toContain("Open:");
  });

  it("DESCRIPTION includes Open: {url} line when task.url is set", () => {
    const tasks = [makeTask({ url: "https://example.com/task/1" })];
    const result = generateIcsContent(tasks);
    expect(result).not.toBeNull();
    expect(result!.content).toContain("Open: https://example.com/task/1");
  });
});
