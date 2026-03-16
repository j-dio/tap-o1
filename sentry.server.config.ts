// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { sentryBeforeSend } from "./src/lib/sentry-before-send";

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
