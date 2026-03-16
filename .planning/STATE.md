---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Stabilization & Launch
status: planning
stopped_at: "Checkpoint 09-02 Task 3: awaiting human verification of export flow"
last_updated: "2026-03-16T06:46:47.328Z"
last_activity: 2026-03-16 — Roadmap created for v1.1 milestone; Phase 8 is next
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 5
  completed_plans: 5
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** Students can see and act on every pending academic task from any source in one place — without switching between platforms.
**Current focus:** Phase 8 — Sentry Monitoring

## Current Position

Phase: 8 of 11 (Sentry Monitoring)
Plan: 0 of ? in current phase
Status: Ready to plan
Last activity: 2026-03-16 — Roadmap created for v1.1 milestone; Phase 8 is next

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (v1.1 milestone)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:** No data yet

*Updated after each plan completion*
| Phase 08-sentry-monitoring P01 | 7min | 2 tasks | 4 files |
| Phase 08-sentry-monitoring P02 | 6min | 1 tasks | 6 files |
| Phase 08-sentry-monitoring P02 | 6min | 2 tasks | 6 files |
| Phase 08-sentry-monitoring P03 | 2min 22sec | 2 tasks | 3 files |
| Phase 09-ics-export P01 | 4min | 2 tasks | 4 files |
| Phase 09-ics-export P02 | 4min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 8]: Use `@sentry/react` (not `@sentry/nextjs`) — avoids 2 MB Node/Edge overhead, React 19 compatible
- [Phase 9]: ICS export is client-side only via `ics` npm library — no server infra, blob download in PWA
- [Phase 9]: Safari PWA fallback required — detect `navigator.standalone`, fall back to Web Share API
- [Phase 8]: `SENTRY_AUTH_TOKEN` must never use `NEXT_PUBLIC_` prefix — source map upload only, out of scope Phase 8
- [Phase 08-sentry-monitoring]: sentryBeforeSend: Sentry v10 Event.breadcrumbs is Breadcrumb[] flat array (not { values: [] })
- [Phase 08-sentry-monitoring]: TOKEN_PARAM_REGEX covers icalUrl|token|feed|key with gi flags for PII scrubbing in sentryBeforeSend
- [Phase 08-sentry-monitoring]: sentryBeforeSend parameter type updated from Event to ErrorEvent to match BrowserOptions.beforeSend signature in Sentry v10
- [Phase 08-sentry-monitoring]: sentryBeforeSend parameter type updated from Event to ErrorEvent to match BrowserOptions.beforeSend signature in Sentry v10
- [Phase 08-sentry-monitoring]: captureReactException used in ErrorBoundary (not captureException) — preserves React component stack in Sentry event
- [Phase 08-sentry-monitoring]: instrumentation-client.ts placed at src/ root — Next.js 15.3+ pre-hydration convention; replayIntegration intentionally absent per SNTY-04
- [Phase 08-sentry-monitoring]: @sentry/nextjs kept (not reverted) — wizard added server/edge coverage; 2MB overhead accepted for full-stack error capture
- [Phase 08-sentry-monitoring]: replaysSessionSampleRate:0 and replaysOnErrorSampleRate:0 added to all three configs as explicit guards against @sentry/nextjs auto-inclusion
- [Phase 09-ics-export]: generateIcsContent is pure function: testable in Vitest node environment following computeActionBoardBuckets pattern
- [Phase 09-ics-export]: ics DateArray uses getUTCMonth()+1 (1-based) to emit DTSTART;VALUE=DATE: for all-day events per RFC 5545
- [Phase 09-ics-export]: ExportButton: success toast fires before navigator.share resolves to avoid waiting on iOS share sheet
- [Phase 09-ics-export]: ExportButton: AbortError from share sheet dismiss silently suppressed — user cancel is expected UX

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 9]: Test Safari iOS PWA blob download on a real device before shipping — silent failure if fallback missing
- [Phase 8]: Verify `@sentry/react@10.43.0` init API against current Sentry docs before implementing
- [Phase 9]: Verify `ics@3.8.1` `createEvents` array format against npm README before implementing
- [Phase 11]: Verify Google Cloud OAuth + Classroom setup steps against actual deployed config before writing

## Session Continuity

Last session: 2026-03-16T06:46:47.322Z
Stopped at: Checkpoint 09-02 Task 3: awaiting human verification of export flow
Resume file: None
