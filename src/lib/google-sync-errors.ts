/** User-facing copy when Google OAuth refresh returns invalid_grant. */
export const GOOGLE_RECONNECT_USER_MESSAGE =
  "Google Classroom disconnected: your Google login expired or access was revoked. Open Settings and reconnect Google to refresh assignments and due dates.";

export function errorIndicatesInvalidGrant(text: string): boolean {
  return (
    /invalid_grant/i.test(text) ||
    /Token has been expired or revoked/i.test(text)
  );
}

/** True when the message is our normalized copy or still contains OAuth invalid_grant text. */
export function syncErrorRequiresGoogleReconnect(text: string): boolean {
  return (
    errorIndicatesInvalidGrant(text) ||
    text.includes("Google Classroom disconnected")
  );
}

export function warningsNeedGoogleReconnect(warnings: string[]): boolean {
  return warnings.some((w) => syncErrorRequiresGoogleReconnect(w));
}

/** Maps refresh/token errors to a short, actionable message when appropriate. */
export function messageForGoogleRefreshFailure(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (errorIndicatesInvalidGrant(raw)) {
    return GOOGLE_RECONNECT_USER_MESSAGE;
  }
  return `Google token refresh failed: ${raw}`;
}

/** Classroom errors that embed a token refresh failure (e.g. mid-sync retry). */
export function messageForGoogleClassroomAuthFailure(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (errorIndicatesInvalidGrant(raw)) {
    return GOOGLE_RECONNECT_USER_MESSAGE;
  }
  return `GClassroom sync failed after token refresh: ${raw}`;
}
