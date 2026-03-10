import { describe, it, expect } from "vitest";
import { generateCourseColor, getCourseColor } from "@/lib/utils";

describe("generateCourseColor", () => {
  it("returns a valid HSL string", () => {
    const color = generateCourseColor("some-course-id");
    expect(color).toMatch(/^hsl\(\d+, 70%, 60%\)$/);
  });

  it("returns the same color for the same courseId (deterministic)", () => {
    const a = generateCourseColor("course-abc");
    const b = generateCourseColor("course-abc");
    expect(a).toBe(b);
  });

  it("returns different colors for different courseIds (high uniqueness)", () => {
    const ids = Array.from({ length: 50 }, (_, i) => `course-${i}`);
    const colors = ids.map(generateCourseColor);
    const uniqueColors = new Set(colors);
    // With 360 possible hues and 50 ids, collisions are very unlikely
    // but we test that at least 80% are unique to avoid false positives
    expect(uniqueColors.size).toBeGreaterThanOrEqual(40);
  });

  it("hue stays within 0-359 range", () => {
    const ids = [
      "a",
      "very-long-course-id-that-hashes-to-something",
      "550e8400-e29b-41d4-a716-446655440000",
      "",
    ];
    for (const id of ids) {
      const color = generateCourseColor(id);
      const hue = parseInt(color.replace(/^hsl\((\d+).*/, "$1"), 10);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });
});

describe("getCourseColor", () => {
  it("returns courseColor when provided", () => {
    expect(getCourseColor("id", "#ff0000")).toBe("#ff0000");
  });

  it("falls back to generateCourseColor when courseColor is null", () => {
    const color = getCourseColor("course-123", null);
    expect(color).toBe(generateCourseColor("course-123"));
  });

  it("returns a default HSL when courseId is null and courseColor is null", () => {
    const color = getCourseColor(null, null);
    expect(color).toMatch(/^hsl\(\d+, 70%, 60%\)$/);
  });
});
