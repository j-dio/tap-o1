---
phase: 08-sentry-monitoring
plan: 02
subsystem: infra
tags: [sentry, error-monitoring, instrumentation, error-boundary, react]

# Dependency graph
requires:
  - phase: 08-sentry-monitoring
    provides: "sentryBeforeSend PII-scrubbing function from 08-01"
provides:
  - "src/instrumentation-client.ts — Sentry.init before React hydration with tracesSampleRate: 0"
  - "ErrorBoundary.componentDidCatch wired to captureReactException (SNTY-02)"
  - "NEXT_PUBLIC_SENTRY_DSN documented in .env.example"
affects: [all-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "instrumentation-client.ts as Next.js 15.3+ pre-hydration init hook"
    - "ErrorBoundary.componentDidCatch as Sentry capture point"

key-files:
  created:
    - src/instrumentation-client.ts
    - src/components/__tests__/error-boundary.test.ts
  modified:
    - src/components/error-boundary.tsx
    - src/lib/sentry-before-send.ts
    - src/lib/__tests__/sentry-before-send.test.ts
    - .env.example

key-decisions:
  - "sentryBeforeSend parameter type updated from Event to ErrorEvent to match BrowserOptions.beforeSend signature"

patterns-established:
  - "TDD pattern: test mock @sentry/react with vi.mock before importing component under test"

requirements-completed: [SNTY-01, SNTY-02, SNTY-04]

# Metrics
duration: 6min
completed: 2026-03-16
---

# Phase 8 Plan 02: Sentry Client Init Summary

**Sentry wired via instrumentation-client.ts (pre-hydration init) and ErrorBoundary.captureReactException, with PII-free config (tracesSampleRate: 0, no replay)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-16T00:37:11Z
- **Completed:** 2026-03-16T00:43:00Z
- **Tasks:** 2 of 2 (complete — human verification approved)
- **Files modified:** 6

## Accomplishments
- Created `src/instrumentation-client.ts` — Sentry.init fires before React hydration, imports sentryBeforeSend, tracesSampleRate: 0, sendDefaultPii: false, no replayIntegration
- Updated `ErrorBoundary.componentDidCatch` to call `Sentry.captureReactException(error, errorInfo)` (SNTY-02), preserving dev-only console.error
- Added `NEXT_PUBLIC_SENTRY_DSN` to `.env.example` with documentation for self-hosters
- 91 tests pass (3 new ErrorBoundary tests added), TypeScript clean

## Task Commits

Each task was committed atomically:

1. **RED phase: add failing ErrorBoundary tests** - `3007555` (test)
2. **Task 1: Create instrumentation-client.ts and update ErrorBoundary** - `71ff127` (feat)

3. **Task 2: Verify Sentry captures errors in production with no PII** - `79b309d` (test — human-verify approved)

_Note: TDD tasks have multiple commits (test RED → feat GREEN)_

## Files Created/Modified
- `src/instrumentation-client.ts` — Sentry.init pre-hydration with sentryBeforeSend, no perf/replay
- `src/components/error-boundary.tsx` — Added captureReactException in componentDidCatch
- `src/components/__tests__/error-boundary.test.ts` — 3 unit tests: captureReactException called, console.error in dev, no console.error in prod
- `src/lib/sentry-before-send.ts` — Type fix: Event -> ErrorEvent to match BrowserOptions.beforeSend
- `src/lib/__tests__/sentry-before-send.test.ts` — Updated to use ErrorEvent type
- `.env.example` — Added NEXT_PUBLIC_SENTRY_DSN entry

## Decisions Made
- `sentryBeforeSend` updated from `Event` to `ErrorEvent` parameter/return type — required to satisfy `BrowserOptions.beforeSend` signature in Sentry v10 (`ErrorEvent extends Event { type: undefined }`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed sentryBeforeSend type mismatch (Event -> ErrorEvent)**
- **Found during:** Task 1 (tsc --noEmit verification)
- **Issue:** `BrowserOptions.beforeSend` expects `(event: ErrorEvent, ...) => ErrorEvent | null` but `sentryBeforeSend` was typed as `(event: Event) => Event | null`. TypeScript error TS2322 blocked tsc --noEmit.
- **Fix:** Changed import and signature in `sentry-before-send.ts` from `Event` to `ErrorEvent`. Updated test file to match. `ErrorEvent extends Event { type: undefined }` — functionally equivalent, no behavior change.
- **Files modified:** `src/lib/sentry-before-send.ts`, `src/lib/__tests__/sentry-before-send.test.ts`
- **Verification:** `npx tsc --noEmit` exits 0, all 91 tests pass
- **Committed in:** `71ff127` (Task 1 feat commit)

---

**Total deviations:** 1 auto-fixed (1 type bug)
**Impact on plan:** Required for TypeScript correctness. No behavior change, no scope creep.

## Issues Encountered
None beyond the type fix documented above.

## User Setup Required

**External service configuration needed for development:**
- Add `NEXT_PUBLIC_SENTRY_DSN=<your-dsn>` to `.env.local` (get from sentry.io → Project Settings → Client Keys)
- The DSN is safe as NEXT_PUBLIC_ — it only allows submitting events, not reading them

Human verification confirmed all 4 production criteria:
- Test error appeared in Sentry Issues within 30 seconds
- No user email in event user context
- Zero performance transactions (tracesSampleRate: 0 confirmed)
- Zero session replay recordings (replayIntegration not imported confirmed)

## Next Phase Readiness
- All Phase 8 Sentry requirements complete: SNTY-01 (init), SNTY-02 (ErrorBoundary), SNTY-03 (PII scrubbing from Plan 01), SNTY-04 (no perf/replay)
- Ready to proceed to Phase 9 (ICS Export)
- No blockers

---
*Phase: 08-sentry-monitoring*
*Completed: 2026-03-16*
