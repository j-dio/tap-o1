// src/instrumentation-client.ts
// Next.js 15.3+ client-side instrumentation — runs before React hydration
//
// Package decision: @sentry/nextjs (not @sentry/react as originally planned)
// Reason: The Sentry wizard installed @sentry/nextjs and added server/edge coverage via
// sentry.server.config.ts, sentry.edge.config.ts, src/instrumentation.ts, and
// src/app/global-error.tsx. Reverting to @sentry/react would break server/edge error capture.
// The 2MB overhead concern from the original plan is accepted in exchange for full-stack coverage.
// See: .planning/phases/08-sentry-monitoring/08-03-SUMMARY.md for full deviation notes.
import * as Sentry from "@sentry/nextjs";
import { sentryBeforeSend } from "@/lib/sentry-before-send";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, // SNTY-01: env var, never hardcoded

  tracesSampleRate: 0,           // SNTY-04: no performance transactions
  sendDefaultPii: false,          // SNTY-03: no automatic IP/user-agent collection
  beforeSend: sentryBeforeSend,   // SNTY-03: scrub student emails and UVEC iCal tokens

  // Session replay explicitly disabled — @sentry/nextjs may auto-include replay integrations
  replaysSessionSampleRate: 0,   // SNTY-04: no session replay recordings
  replaysOnErrorSampleRate: 0,   // SNTY-04: no error-triggered replay recordings

  enableLogs: true,
});

// Required by @sentry/nextjs for router transition breadcrumbs
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
