// src/instrumentation-client.ts
// Next.js 15.3+ file-system convention: runs in browser before React hydration
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
import * as Sentry from "@sentry/react";
import { sentryBeforeSend } from "@/lib/sentry-before-send";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0, // SNTY-04: no performance transactions
  sendDefaultPii: false, // SNTY-03: no automatic IP/user-agent collection
  // Note: replayIntegration() intentionally NOT included — SNTY-04
  beforeSend: sentryBeforeSend,
});
