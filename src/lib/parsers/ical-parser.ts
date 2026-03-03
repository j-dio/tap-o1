// UVEC iCal parser: .ics text -> ParsedTask[]
// Uses ical.js for parsing

import { z } from "zod";
import type { ParsedTask, TaskType } from "../../types/task";
import ical from "ical.js";

const MAX_ICAL_SIZE = 5 * 1024 * 1024; // 5MB

const ICalEventSchema = z.object({
  external_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  due_date: z.string(),
  type: z.enum(["assignment", "quiz", "exam", "event"]),
});

function normalizeType(category: string | undefined): TaskType {
  if (!category) return "event";
  const lower = category.toLowerCase();
  if (
    lower === "assignment" ||
    lower === "quiz" ||
    lower === "exam" ||
    lower === "event"
  ) {
    return lower as TaskType;
  }
  return "event";
}

/**
 * Extract a course identifier from iCal event properties.
 * Moodle/UVEC often stores the course name in CATEGORIES or as a prefix
 * in the DESCRIPTION field (e.g., "Course: Intro to CS" or
 * "[CS101] Assignment 1").
 */
function extractCourseId(
  category: string | null,
  description: string | null,
  summary: string | null,
): string | null {
  // Prefer CATEGORIES — Moodle sets this to the course shortname
  if (category) {
    const trimmed = category.trim();
    if (trimmed.length > 0) return trimmed;
  }

  // Try to pull course from description: "Course: <name>" pattern
  if (description) {
    const courseMatch = description.match(/^Course:\s*(.+)/im);
    if (courseMatch?.[1]) return courseMatch[1].trim();
  }

  // Try bracketed prefix in summary: "[CS101] Assignment 1"
  if (summary) {
    const bracketMatch = summary.match(/^\[([^\]]+)\]/);
    if (bracketMatch?.[1]) return bracketMatch[1].trim();
  }

  return null;
}

export interface ICalParseResult {
  tasks: ParsedTask[];
  errors: string[];
  /** Map of courseExternalId -> display name extracted from iCal */
  courseNames: Map<string, string>;
}

export function parseICal(ics: string): ICalParseResult {
  const errors: string[] = [];
  const courseNames = new Map<string, string>();

  if (ics.length > MAX_ICAL_SIZE) {
    return {
      tasks: [],
      errors: ["iCal file exceeds 5MB size limit"],
      courseNames,
    };
  }

  if (!ics.trim()) {
    return { tasks: [], errors: [], courseNames };
  }

  try {
    const jcal = ical.parse(ics);
    const comp = new ical.Component(jcal);
    const events = comp.getAllSubcomponents("vevent");
    const tasks: ParsedTask[] = [];

    for (const ev of events) {
      const uid = ev.getFirstPropertyValue("uid");
      const summary = ev.getFirstPropertyValue("summary");
      const description = ev.getFirstPropertyValue("description");
      const dtstart = ev.getFirstPropertyValue("dtstart");
      const category = ev.getFirstPropertyValue("categories");

      if (!uid || !summary || !dtstart) {
        errors.push("Skipped event: missing uid/summary/dtstart");
        continue;
      }

      const categoryStr = category ? String(category) : null;
      const descStr = description ? String(description) : null;
      const summaryStr = String(summary);
      const courseId = extractCourseId(categoryStr, descStr, summaryStr);

      // Track course names for later upsert
      if (courseId) {
        courseNames.set(courseId, courseId);
      }

      const parsed = ICalEventSchema.safeParse({
        external_id: String(uid),
        title: summaryStr,
        description: descStr ?? undefined,
        due_date: typeof dtstart === "string" ? dtstart : dtstart.toString(),
        type: normalizeType(categoryStr?.toLowerCase() ?? undefined),
      });

      if (parsed.success) {
        tasks.push({
          externalId: parsed.data.external_id,
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          dueDate: parsed.data.due_date,
          type: parsed.data.type,
          source: "uvec",
          courseExternalId: courseId,
          url: null,
        });
      } else {
        errors.push(`Skipped event ${uid}: validation failed`);
      }
    }

    return { tasks, errors, courseNames };
  } catch (err) {
    return {
      tasks: [],
      errors: [
        `iCal parse error: ${err instanceof Error ? err.message : "Unknown error"}`,
      ],
      courseNames,
    };
  }
}
