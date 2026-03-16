// src/instrumentation-client.ts
// Next.js 15.3+ client-side instrumentation
import * as Sentry from "@sentry/nextjs"; // Updated to use Next.js specific package
import { sentryBeforeSend } from "@/lib/sentry-before-send"; // Preserved GSD PII scrubber

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // --- STRICT MILESTONE SETTINGS (Overriding Wizard Defaults) ---
  tracesSampleRate: 0, // SNTY-04: Keep performance transactions off to save quota
  sendDefaultPii: false, // SNTY-03: Prevent automatic IP/user-agent collection
  beforeSend: sentryBeforeSend, // SNTY-03: Scrub student emails and UVEC tokens

  // --- WIZARD ADDITIONS ---
  enableLogs: true,
});

// Required by Sentry wizard for Next.js router transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
