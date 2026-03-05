// Google Classroom API client for Task Aggregator

import { z } from "zod";
import {
  GClassroomCourseSchema,
  GClassroomCourseWorkSchema,
  GClassroomAnnouncementSchema,
  parseGClassroomResponse,
} from "../lib/parsers/gclassroom-parser";
import type { ParsedTask } from "../types/task";

type GClassroomCourse = z.infer<typeof GClassroomCourseSchema>;
type GClassroomCourseWork = z.infer<typeof GClassroomCourseWorkSchema>;
type GClassroomAnnouncement = z.infer<typeof GClassroomAnnouncementSchema>;

interface GClassroomApiConfig {
  accessToken: string;
}

const BASE_URL = "https://classroom.googleapis.com/v1";

/**
 * Refresh the Google access token using a stored refresh token.
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars on the server.
 */
export async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set for token refresh",
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "Unknown error");
    throw new Error(`Google token refresh failed (${res.status}): ${body}`);
  }

  return res.json();
}

export class GClassroomService {
  private accessToken: string;

  constructor(config: GClassroomApiConfig) {
    this.accessToken = config.accessToken;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("GOOGLE_TOKEN_EXPIRED");
      }
      throw new Error(`Google Classroom API error: ${res.status}`);
    }
    return await res.json();
  }

  async getCourses(): Promise<GClassroomCourse[]> {
    const data = await this.fetch<{ courses: unknown[] }>("/courses");
    if (!data.courses) return [];
    return data.courses
      .map((course) => {
        try {
          return GClassroomCourseSchema.parse(course);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as GClassroomCourse[];
  }

  async getCourseWork(courseId: string): Promise<GClassroomCourseWork[]> {
    const data = await this.fetch<{ courseWork: unknown[] }>(
      `/courses/${courseId}/courseWork`,
    );
    if (!data.courseWork) return [];
    return data.courseWork
      .map((cw) => {
        try {
          return GClassroomCourseWorkSchema.parse(cw);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as GClassroomCourseWork[];
  }

  async getAnnouncements(courseId: string): Promise<GClassroomAnnouncement[]> {
    const data = await this.fetch<{ announcements: unknown[] }>(
      `/courses/${courseId}/announcements`,
    );
    if (!data.announcements) return [];
    return data.announcements
      .map((ann) => {
        try {
          return GClassroomAnnouncementSchema.parse(ann);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as GClassroomAnnouncement[];
  }

  /**
   * Fetch all student submissions for a course using the wildcard
   * courseWork ID ("-") so we get everything in a single request.
   * Returns a map: courseWorkId -> submission state string.
   */
  async getStudentSubmissions(courseId: string): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    try {
      const data = await this.fetch<{
        studentSubmissions?: {
          courseWorkId?: string;
          state?: string;
          userId?: string;
        }[];
      }>(`/courses/${courseId}/courseWork/-/studentSubmissions?userId=me`);

      if (data.studentSubmissions) {
        for (const sub of data.studentSubmissions) {
          if (sub.courseWorkId && sub.state) {
            map.set(sub.courseWorkId, sub.state);
          }
        }
      }
    } catch {
      // Non-critical: if submissions fail, tasks still sync without status
    }
    return map;
  }
}
