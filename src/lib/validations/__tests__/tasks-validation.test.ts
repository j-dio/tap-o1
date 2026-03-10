import { describe, it, expect } from "vitest";
import {
  createCustomTaskSchema,
  updateCustomTaskSchema,
} from "@/lib/validations/tasks";

describe("createCustomTaskSchema", () => {
  it("should accept a valid minimal task (title only)", () => {
    const result = createCustomTaskSchema.safeParse({
      title: "My custom task",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("My custom task");
      expect(result.data.type).toBe("assignment"); // default
    }
  });

  it("should accept a fully populated task", () => {
    const result = createCustomTaskSchema.safeParse({
      title: "Final paper",
      description: "Write the final paper for English 101",
      dueDate: "2026-04-15T23:59:00.000Z",
      type: "assignment",
      courseId: "550e8400-e29b-41d4-a716-446655440000",
      priority: "high",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty title", () => {
    const result = createCustomTaskSchema.safeParse({
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing title", () => {
    const result = createCustomTaskSchema.safeParse({
      description: "No title provided",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid dueDate (not ISO datetime)", () => {
    const result = createCustomTaskSchema.safeParse({
      title: "Some task",
      dueDate: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid priority value", () => {
    const result = createCustomTaskSchema.safeParse({
      title: "Some task",
      priority: "critical",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid type value", () => {
    const result = createCustomTaskSchema.safeParse({
      title: "Some task",
      type: "homework",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid courseId (not UUID)", () => {
    const result = createCustomTaskSchema.safeParse({
      title: "Some task",
      courseId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid priority enum values", () => {
    for (const priority of ["low", "medium", "high", "urgent"]) {
      const result = createCustomTaskSchema.safeParse({
        title: "Task",
        priority,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all valid type enum values", () => {
    for (const type of [
      "assignment",
      "quiz",
      "exam",
      "event",
      "announcement",
    ]) {
      const result = createCustomTaskSchema.safeParse({
        title: "Task",
        type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should reject title exceeding max length (500)", () => {
    const result = createCustomTaskSchema.safeParse({
      title: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCustomTaskSchema", () => {
  it("should accept a valid update with title", () => {
    const result = updateCustomTaskSchema.safeParse({
      title: "Updated title",
    });
    expect(result.success).toBe(true);
  });

  it("should accept nullable fields", () => {
    const result = updateCustomTaskSchema.safeParse({
      title: "Updated",
      description: null,
      dueDate: null,
      priority: null,
      courseId: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing title", () => {
    const result = updateCustomTaskSchema.safeParse({
      description: "Only description",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty title", () => {
    const result = updateCustomTaskSchema.safeParse({
      title: "",
    });
    expect(result.success).toBe(false);
  });
});
