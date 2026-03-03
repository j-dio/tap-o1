// UVEC service: fetch, parse, normalize tasks

import { parseICal } from "../lib/parsers/ical-parser";
import type { ParsedTask } from "../types/task";

/**
 * Fetches raw iCal text directly from the UVEC server.
 * Used server-side (sync action) where CORS doesn't apply.
 */
export async function fetchUvecICal(icalUrl: string): Promise<string> {
  const resp = await fetch(icalUrl, {
    headers: {
      "User-Agent": "TaskAggregator/1.0",
      Accept: "text/calendar, text/plain, */*",
    },
  });

  if (!resp.ok) {
    throw new Error(
      `UVEC returned ${resp.status}. Your iCal URL may have expired — try re-exporting from UVEC.`,
    );
  }

  const icsText = await resp.text();

  if (!icsText || !icsText.includes("BEGIN:VCALENDAR")) {
    throw new Error("Invalid iCal response from UVEC (not a calendar feed)");
  }

  return icsText;
}

/**
 * Fetches raw iCal text via the Supabase Edge Function proxy.
 * Used client-side (settings page test) where CORS requires a proxy.
 */
export async function fetchUvecICalViaProxy(
  icalUrl: string,
  accessToken: string,
): Promise<string> {
  const proxyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/uvec-proxy?icalUrl=${encodeURIComponent(icalUrl)}`;

  const resp = await fetch(proxyUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "Unknown error");
    throw new Error(`UVEC proxy returned ${resp.status}: ${body}`);
  }

  const icsText = await resp.text();

  if (!icsText || !icsText.includes("BEGIN:VCALENDAR")) {
    throw new Error("Invalid iCal response from UVEC proxy");
  }

  return icsText;
}

export interface UvecIngestResult {
  tasks: ParsedTask[];
  courseNames: Map<string, string>;
}

/**
 * Fetches and parses UVEC tasks for a user.
 * Fetches directly from UVEC (server-side, no proxy needed).
 */
export async function ingestUvecTasks(
  icalUrl: string,
): Promise<UvecIngestResult> {
  const icsText = await fetchUvecICal(icalUrl);
  const { tasks, errors, courseNames } = parseICal(icsText);

  if (tasks.length === 0 && errors.length > 0) {
    throw new Error(`UVEC parse failed: ${errors[0]}`);
  }

  return { tasks, courseNames };
}
