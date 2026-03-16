# Roadmap: TapO(1)

## Milestones

- ✅ **v1.0 Core Product** - Phases 1–7.5 (shipped 2026-03-16)
- 🚧 **v1.1 Stabilization & Launch** - Phases 8–11 (in progress)

## Phases

<details>
<summary>✅ v1.0 Core Product (Phases 1–7.5) - SHIPPED 2026-03-16</summary>

| Phase | Name | Key deliverable |
|-------|------|-----------------|
| 1 | Foundation | Auth, UVEC iCal ingestion, Supabase setup |
| 2 | Google Classroom | GClassroom API integration, unified task schema |
| 3 | Sync Engine | Promise.allSettled sync, task_overrides immutable model |
| 4 | Action Board | Kanban columns, drag-and-drop (dnd-kit) |
| 5 | Custom Tasks + Calendar | Custom task creation, /dashboard/calendar route |
| 6 | Push Notifications | Serwist PWA, Supabase Edge Function cron |
| 7 | Brand + History + Smart Sync | TapO(1) branding, UP Cebu palette, history page, first-sync banner |
| 7.5 | Polishes | Unified 7-by-7 pagination, card hover redesign, drop animations |

</details>

### 🚧 v1.1 Stabilization & Launch (In Progress)

**Milestone Goal:** Error monitoring active in production, ICS calendar export for students, landing page communicating core value, and self-hosting README enabling external developers.

- [x] **Phase 8: Sentry Monitoring** - Client-side error monitoring with PII protection active in production (completed 2026-03-16)
- [x] **Phase 9: ICS Export** - Students can download tasks as a calendar file for Apple/Google Calendar (completed 2026-03-16)
- [ ] **Phase 10: Landing Page** - Visitors understand what TapO(1) does and how to get started
- [ ] **Phase 11: Self-Hosting README** - External developers can deploy their own instance from README alone

## Phase Details

### Phase 8: Sentry Monitoring
**Goal**: Production errors are captured and surfaced to the developer without exposing user PII
**Depends on**: Nothing (first phase of milestone — establishes monitoring baseline)
**Requirements**: SNTY-01, SNTY-02, SNTY-03, SNTY-04
**Success Criteria** (what must be TRUE):
  1. App loads in production without a Sentry initialization error in the browser console
  2. A deliberately thrown React error is captured in the Sentry dashboard as a new issue
  3. Captured events contain no user email address or UVEC iCal URL token
  4. Sentry dashboard shows zero performance transactions and zero session replay recordings
**Plans**: 2 plans

Plans:
- [ ] 08-01-PLAN.md — Install @sentry/react and create tested PII-scrubbing sentryBeforeSend pure function
- [ ] 08-02-PLAN.md — Wire Sentry init (instrumentation-client.ts) and ErrorBoundary capture, human verify production

### Phase 9: ICS Export
**Goal**: Students can download all pending and in-progress tasks as a standards-compliant calendar file
**Depends on**: Phase 8 (Sentry monitoring covers any export errors)
**Requirements**: ICS-01, ICS-02, ICS-03, ICS-04, ICS-05
**Success Criteria** (what must be TRUE):
  1. Clicking "Export to Calendar" on the dashboard downloads a .ics file that imports correctly into Google Calendar and Apple Calendar
  2. Imported events show correct due date/time in the user's local timezone with no floating-time ambiguity
  3. UVEC and Google Classroom tasks each have distinct UIDs that do not collide when imported into the same calendar
  4. On an iPhone in Safari PWA standalone mode, the export triggers the iOS Share Sheet (not a silent failure)
  5. When all tasks are done or dismissed, clicking Export shows a "No tasks to export" toast and no file is downloaded
**Plans**: 2 plans

Plans:
- [ ] 09-01-PLAN.md — Install ics library and implement generateIcsContent pure function with TDD (ICS-01, ICS-02, ICS-03, ICS-05)
- [ ] 09-02-PLAN.md — Create ExportButton component and wire into sidebar and mobile header (ICS-01, ICS-04)

### Phase 10: Landing Page
**Goal**: New visitors immediately understand TapO(1)'s purpose for UP Cebu students and know how to start
**Depends on**: Phase 8 (Sentry captures any landing page errors)
**Requirements**: LAND-01, LAND-02, LAND-03, LAND-04, LAND-05, LAND-06
**Success Criteria** (what must be TRUE):
  1. A student reading the hero section can state the specific problem TapO(1) solves (UVEC + Google Classroom aggregation for UP Cebu) without scrolling
  2. A new visitor can follow the "How it works" section to understand the 3-step setup without prior knowledge of the app
  3. The primary "Sign in with Google" CTA navigates to /login; the secondary README link opens the GitHub README
  4. A logged-in user navigating to / is redirected to /dashboard without seeing the landing page
  5. The landing page renders correctly on a 375px mobile viewport with no horizontal overflow
**Plans**: 2 plans

Plans:
- [ ] 10-01-PLAN.md — Implement landing page: auth redirect + hero, how-it-works, features, CTAs (LAND-01–06)
- [ ] 10-02-PLAN.md — Build regression check + human verify all 6 LAND requirements in browser

### Phase 11: Self-Hosting README
**Goal**: An external developer can deploy a fully functional TapO(1) instance by following the README alone
**Depends on**: Phases 8–10 (README documents all env vars confirmed during those phases, including Sentry DSN)
**Requirements**: README-01, README-02, README-03, README-04, README-05
**Success Criteria** (what must be TRUE):
  1. Every environment variable in the codebase appears in the README env vars table with its source (where to get it)
  2. A developer following the Supabase setup section arrives at a working database with all migrations applied via `supabase db push`
  3. A developer following the Google Cloud section has OAuth sign-in and Classroom API access working with redirect URIs configured in both Google Cloud Console and Supabase Auth
  4. A developer following the push notifications section successfully generates VAPID keys and understands the `mailto:` prefix requirement for `VAPID_SUBJECT`
  5. The tech stack section lists all major dependencies with versions matching those in package.json
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

## Progress

**Execution Order:** 8 → 9 → 10 → 11

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1–7.5 (v1.0) | v1.0 | — | Complete | 2026-03-16 |
| 8. Sentry Monitoring | 3/3 | Complete   | 2026-03-16 | - |
| 9. ICS Export | 2/2 | Complete    | 2026-03-16 | - |
| 10. Landing Page | v1.1 | 0/2 | Not started | - |
| 11. Self-Hosting README | v1.1 | 0/? | Not started | - |
