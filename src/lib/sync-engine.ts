// Sync engine for Task Aggregator
// Orchestrates task ingestion from UVEC and Google Classroom

import type { ParsedTask } from "../types/task";
import { GClassroomService } from "../services/gclassroom-service";
import { refreshGoogleAccessToken } from "../services/gclassroom-service";
import { parseGClassroomResponse } from "./parsers/gclassroom-parser";
import { ingestUvecTasks } from "../services/uvec-service";

export interface SyncConfig {
  /** Google OAuth access token (may be null after first session) */
  gclassroomToken?: string;
  /** Google OAuth refresh token (persisted in profiles table) */
  gclassroomRefreshToken?: string;
  /** UVEC iCal export URL */
  uvecIcalUrl?: string;
}

export interface SyncResult {
  tasks: ParsedTask[];
  errors: string[];
}

export async function syncTasks(config: SyncConfig): Promise<SyncResult> {
  const errors: string[] = [];
  let uvecTasks: ParsedTask[] = [];
  let gclassroomTasks: ParsedTask[] = [];

  if (
    !config.uvecIcalUrl &&
    !config.gclassroomToken &&
    !config.gclassroomRefreshToken
  ) {
    return {
      tasks: [],
      errors: [
        "No data sources configured. Add UVEC URL or connect Google Classroom in Settings.",
      ],
    };
  }

  // --- UVEC ---
  if (config.uvecIcalUrl) {
    try {
      const fetched = await ingestUvecTasks(config.uvecIcalUrl);
      uvecTasks = Array.isArray(fetched) ? [...fetched] : [];
    } catch (err) {
      errors.push(
        `UVEC sync failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  // --- Google Classroom ---
  let googleToken = config.gclassroomToken;

  // If no access token but we have a refresh token, refresh it
  if (!googleToken && config.gclassroomRefreshToken) {
    try {
      const refreshed = await refreshGoogleAccessToken(
        config.gclassroomRefreshToken,
      );
      googleToken = refreshed.access_token;
    } catch (err) {
      errors.push(
        `Google token refresh failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  if (googleToken) {
    try {
      const gclassroom = new GClassroomService({
        accessToken: googleToken,
      });
      const courses = await gclassroom.getCourses();

      // Fetch courseWork in parallel for performance
      const results = await Promise.allSettled(
        courses.map((course) => gclassroom.getCourseWork(course.id)),
      );

      const allCourseWork: unknown[] = [];
      for (const result of results) {
        if (result.status === "fulfilled") {
          allCourseWork.push(...result.value);
        } else {
          errors.push(`Failed to fetch courseWork: ${result.reason}`);
        }
      }

      gclassroomTasks = parseGClassroomResponse({ courseWork: allCourseWork });
    } catch (err) {
      if (err instanceof Error && err.message === "GOOGLE_TOKEN_EXPIRED") {
        // Try refreshing if the token expired mid-sync
        if (config.gclassroomRefreshToken) {
          try {
            const refreshed = await refreshGoogleAccessToken(
              config.gclassroomRefreshToken,
            );
            const gclassroom = new GClassroomService({
              accessToken: refreshed.access_token,
            });
            const courses = await gclassroom.getCourses();
            const results = await Promise.allSettled(
              courses.map((course) => gclassroom.getCourseWork(course.id)),
            );
            const allCourseWork: unknown[] = [];
            for (const result of results) {
              if (result.status === "fulfilled") {
                allCourseWork.push(...result.value);
              }
            }
            gclassroomTasks = parseGClassroomResponse({
              courseWork: allCourseWork,
            });
          } catch (retryErr) {
            errors.push(
              `GClassroom sync failed after token refresh: ${retryErr instanceof Error ? retryErr.message : "Unknown error"}`,
            );
          }
        } else {
          errors.push(
            "Google Classroom token expired. Please reconnect Google in Settings.",
          );
        }
      } else {
        errors.push(
          `GClassroom sync failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    }
  }

  // Merge and deduplicate tasks by source + externalId
  const merged = [...uvecTasks, ...gclassroomTasks];
  const deduped = Array.from(
    new Map(merged.map((t) => [`${t.source}:${t.externalId}`, t])).values(),
  );

  return { tasks: deduped, errors };
}
