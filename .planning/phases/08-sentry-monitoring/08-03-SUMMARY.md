---
phase: 08-sentry-monitoring
plan: "03"
subsystem: sentry
tags: [sentry, security, pii, config, gap-closure]
dependency_graph:
  requires: [08-01, 08-02]
  provides: [sentry-config-compliant]
  affects: [sentry.server.config.ts, sentry.edge.config.ts, src/instrumentation-client.ts]
tech_stack:
  added: []
  patterns: [env-var-dsn, beforeSend-pii-scrubbing, replay-disabled]
key_files:
  created: []
  modified:
    - sentry.server.config.ts
    - sentry.edge.config.ts
    - src/instrumentation-client.ts
decisions:
  - "@sentry/nextjs kept (not reverted to @sentry/react) — wizard added server/edge coverage via instrumentation.ts and global-error.tsx; reverting would break that coverage; 2MB overhead accepted for full-stack error capture"
  - "replaysSessionSampleRate:0 and replaysOnErrorSampleRate:0 added to all three configs as explicit guards against @sentry/nextjs auto-inclusion of replay integrations"
metrics:
  duration: "2min 22sec"
  completed_date: "2026-03-16"
  tasks_completed: 2
  files_modified: 3
---

# Phase 8 Plan 3: Sentry Config Gap Closure Summary

**One-liner:** Applied project-strict PII/perf settings (env-var DSN, tracesSampleRate:0, sendDefaultPii:false, beforeSend:sentryBeforeSend, replay rates:0) to all three Sentry init files to close the 5 gaps left by the Sentry wizard.

## What Was Done

The Sentry wizard (run during phase 08-02) auto-generated three config files with insecure defaults — hardcoded DSN, tracing enabled, PII collection on, no beforeSend wired. This plan applied surgical corrections to close all gaps identified in 08-VERIFICATION.md.

**Files NOT touched** (correct by design):
- `src/lib/sentry-before-send.ts` — PII scrubbing logic correct
- `src/components/error-boundary.tsx` — ErrorBoundary correct
- `src/instrumentation.ts` — wizard-added server instrumentation, acceptable
- `src/app/global-error.tsx` — wizard-added global error handler, acceptable
- `next.config.ts` — Sentry webpack plugin config, acceptable

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix sentry.server.config.ts and sentry.edge.config.ts | aaa7e00 | sentry.server.config.ts, sentry.edge.config.ts |
| 2 | Update instrumentation-client.ts replay rates and align comment | c139440 | src/instrumentation-client.ts |

## Verification Results

All 5 gaps from 08-VERIFICATION.md closed:

1. **Hardcoded DSN**: `grep -r "43798bc2" ...` — no matches (PASS)
2. **tracesSampleRate**: All three configs show `0` (PASS)
3. **sendDefaultPii**: All three configs show `false` (PASS)
4. **beforeSend wired**: server and edge both import and use `sentryBeforeSend` (PASS)
5. **Replay disabled**: All three configs have `replaysSessionSampleRate:0` and `replaysOnErrorSampleRate:0` (PASS)
6. **Tests**: 91/91 passing (PASS)
7. **TypeScript**: `npx tsc --noEmit` exits 0 (PASS)

## Deviations from Plan

None — plan executed exactly as written. The @sentry/nextjs package decision documented in instrumentation-client.ts header was explicitly requested by the plan.

## Package Decision: @sentry/nextjs

The original Phase 8 plan called for `@sentry/react`. The Sentry wizard installed `@sentry/nextjs` and added server/edge coverage via `src/instrumentation.ts` and `src/app/global-error.tsx`. Reverting to `@sentry/react` would:
- Break server-side error capture (instrumentation.ts uses @sentry/nextjs)
- Break edge-runtime error capture (sentry.edge.config.ts uses @sentry/nextjs)
- Break global error boundary (global-error.tsx uses @sentry/nextjs)

Decision: Keep `@sentry/nextjs`. The 2MB Node/Edge overhead concern from the original plan is accepted in exchange for full-stack error coverage (client + server + edge).

## Self-Check: PASSED

Files verified present:
- sentry.server.config.ts: FOUND
- sentry.edge.config.ts: FOUND
- src/instrumentation-client.ts: FOUND

Commits verified:
- aaa7e00: FOUND (fix(08-03): replace rogue wizard configs...)
- c139440: FOUND (fix(08-03): add replay rates to instrumentation-client...)
