"use server";

import { createClient } from "@/lib/supabase/server";
import { syncTasks, type SyncResult } from "@/lib/sync-engine";

export interface SyncResponse {
  synced: number;
  errors: string[];
}

/**
 * Server action to sync tasks from UVEC and Google Classroom.
 * Fetches from external sources, parses, and upserts to database.
 */
export async function syncAllTasks(): Promise<SyncResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { synced: 0, errors: ["Not authenticated"] };
  }

  // Get session for access token and provider tokens
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { synced: 0, errors: ["No active session. Please sign in again."] };
  }

  // Get profile for UVEC URL and stored Google refresh token
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("uvec_ical_url, google_refresh_token")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return {
      synced: 0,
      errors: [`Failed to load profile: ${profileError.message}`],
    };
  }

  // provider_token is only available immediately after OAuth sign-in
  // (not persisted in Supabase SSR cookies), so we primarily rely on
  // the stored refresh token for Google Classroom sync.
  const googleAccessToken = session.provider_token ?? undefined;
  const googleRefreshToken =
    session.provider_refresh_token ??
    profile?.google_refresh_token ??
    undefined;

  // Build config and surface helpful messages when sources are missing
  const hasUvec = !!profile?.uvec_ical_url;
  const hasGoogle = !!(googleAccessToken || googleRefreshToken);

  if (!hasUvec && !hasGoogle) {
    return {
      synced: 0,
      errors: [
        "No data sources configured. Add your UVEC URL or connect Google Classroom in Settings.",
      ],
    };
  }

  // Run sync engine with all tokens
  let result: SyncResult;
  try {
    result = await syncTasks({
      uvecIcalUrl: profile?.uvec_ical_url ?? undefined,
      gclassroomToken: googleAccessToken,
      gclassroomRefreshToken: googleRefreshToken,
    });
  } catch (err) {
    return {
      synced: 0,
      errors: [
        `Sync engine error: ${err instanceof Error ? err.message : "Unknown error"}`,
      ],
    };
  }

  if (result.tasks.length === 0) {
    return { synced: 0, errors: result.errors };
  }

  // Upsert courses first (collect unique course external IDs)
  const courseMap = new Map<string, string>(); // externalId:source -> db id
  const uniqueCourses = new Map<
    string,
    { externalId: string; source: string; name: string }
  >();

  for (const task of result.tasks) {
    if (task.courseExternalId) {
      const key = `${task.courseExternalId}:${task.source}`;
      if (!uniqueCourses.has(key)) {
        // Use real course name from the API if available, fall back to externalId
        const displayName =
          result.courseNames.get(task.courseExternalId) ??
          task.courseExternalId;
        uniqueCourses.set(key, {
          externalId: task.courseExternalId,
          source: task.source,
          name: displayName,
        });
      }
    }
  }

  if (uniqueCourses.size > 0) {
    const courseRows = Array.from(uniqueCourses.values()).map((c) => ({
      user_id: user.id,
      external_id: c.externalId,
      source: c.source,
      name: c.name,
    }));

    const { data: upsertedCourses } = await supabase
      .from("courses")
      .upsert(courseRows, {
        onConflict: "user_id,external_id,source",
        ignoreDuplicates: false,
      })
      .select("id, external_id, source");

    if (upsertedCourses) {
      for (const c of upsertedCourses) {
        courseMap.set(`${c.external_id}:${c.source}`, c.id);
      }
    }
  }

  // If courseMap is empty but we have courses, fetch them
  if (courseMap.size === 0 && uniqueCourses.size > 0) {
    const { data: existingCourses } = await supabase
      .from("courses")
      .select("id, external_id, source")
      .eq("user_id", user.id);

    if (existingCourses) {
      for (const c of existingCourses) {
        courseMap.set(`${c.external_id}:${c.source}`, c.id);
      }
    }
  }

  // Upsert tasks
  const taskRows = result.tasks.map((t) => {
    const courseKey = t.courseExternalId
      ? `${t.courseExternalId}:${t.source}`
      : null;
    const row: Record<string, unknown> = {
      user_id: user.id,
      external_id: t.externalId,
      source: t.source,
      title: t.title,
      description: t.description,
      due_date: t.dueDate,
      type: t.type,
      course_id: courseKey ? (courseMap.get(courseKey) ?? null) : null,
    };
    // Only include url if present (column may not exist yet in older schemas)
    if (t.url) {
      row.url = t.url;
    }
    // Only include status when the parser explicitly set it (e.g. GC submission)
    if (t.status) {
      row.status = t.status;
    }
    return row;
  });

  const { error: taskError } = await supabase.from("tasks").upsert(taskRows, {
    onConflict: "user_id,external_id,source",
    ignoreDuplicates: false,
  });

  if (taskError) {
    result.errors.push(`Task upsert failed: ${taskError.message}`);
  }

  return {
    synced: taskError ? 0 : result.tasks.length,
    errors: result.errors,
  };
}
