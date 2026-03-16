# Requirements: TapO(1) — v1.1 Stabilization & Launch

**Defined:** 2026-03-16
**Core Value:** Students can see and act on every pending academic task from any source in one place — without switching between platforms.

## v1.1 Requirements

### ICS Export

- [x] **ICS-01**: User can download all pending and in-progress tasks as a `.ics` file from the dashboard
- [x] **ICS-02**: Exported `.ics` file is RFC 5545 compliant with UTC timestamps (no floating times)
- [x] **ICS-03**: Each exported task event has a globally unique UID prefixed by source (e.g., `uvec-{id}@tapo1.app`)
- [x] **ICS-04**: Export works in Safari PWA standalone mode (falls back to Web Share API when blob download is unavailable)
- [x] **ICS-05**: User sees a "No tasks to export" notification when all tasks are done or dismissed (no empty `.ics` download)

### Sentry Monitoring

- [x] **SNTY-01**: Sentry SDK initializes on app load in the client bundle with error capture enabled
- [x] **SNTY-02**: All unhandled React errors are captured and sent to Sentry via the existing ErrorBoundary
- [x] **SNTY-03**: PII is stripped before sending to Sentry (user email and UVEC iCal URL tokens removed from events)
- [x] **SNTY-04**: Performance tracing and session replay are disabled (error-only monitoring)

### Landing Page

- [x] **LAND-01**: Landing page hero communicates the specific student problem (UVEC Moodle + Google Classroom aggregation) with UP Cebu context
- [x] **LAND-02**: "How it works" section shows the 3-step setup flow (sign in → connect UVEC → sync GClassroom)
- [x] **LAND-03**: Feature highlights section calls out drag-and-drop board, offline PWA capabilities, and custom task creation
- [x] **LAND-04**: Primary CTA links to `/login`; secondary CTA links to the self-hosting README (GitHub)
- [x] **LAND-05**: Authenticated users visiting `/` are redirected to `/dashboard` (no landing page shown to logged-in users)
- [x] **LAND-06**: Landing page is fully mobile-responsive and uses existing TapO(1) maroon/cream brand palette

### Self-Hosting README

- [ ] **README-01**: README documents all required environment variables with names, descriptions, and where to obtain each value
- [ ] **README-02**: README includes step-by-step Supabase setup: project creation, `supabase db push`, Edge Function deployment, Google OAuth configuration
- [ ] **README-03**: README includes Google Cloud Console steps: OAuth consent screen, Classroom API enable, redirect URI configuration
- [ ] **README-04**: README includes VAPID key generation and push notification configuration (including `VAPID_SUBJECT` mailto prefix requirement)
- [ ] **README-05**: README documents the full tech stack with versions and architecture overview for contributors

## v2 Requirements

*(Deferred — not in current milestone)*

### Export Enhancements

- **ICS-06**: User can export a single task to calendar from the task card
- **ICS-07**: User can choose date range or filter (e.g., "export only UVEC tasks") before downloading

### Sentry Advanced

- **SNTY-05**: Source maps upload configured in CI/CD for readable stack traces
- **SNTY-06**: Performance tracing enabled with appropriate sample rate

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automated E2E tests | User handles QA manually |
| Production deployment automation | User deploys to Netlify/Vercel manually |
| Sentry Session Replay | PII risk (UVEC tokens, task content) — deferred indefinitely |
| Sentry source maps in Phase 8 | Requires `SENTRY_AUTH_TOKEN` in CI — out of scope for this milestone |
| Mobile native app | Web-first strategy; PWA covers mobile |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ICS-01 | Phase 9 | Complete |
| ICS-02 | Phase 9 | Complete |
| ICS-03 | Phase 9 | Complete |
| ICS-04 | Phase 9 | Complete |
| ICS-05 | Phase 9 | Complete |
| SNTY-01 | Phase 8 | Complete |
| SNTY-02 | Phase 8 | Complete |
| SNTY-03 | Phase 8 | Complete |
| SNTY-04 | Phase 8 | Complete |
| LAND-01 | Phase 10 | Complete |
| LAND-02 | Phase 10 | Complete |
| LAND-03 | Phase 10 | Complete |
| LAND-04 | Phase 10 | Complete |
| LAND-05 | Phase 10 | Complete |
| LAND-06 | Phase 10 | Complete |
| README-01 | Phase 11 | Pending |
| README-02 | Phase 11 | Pending |
| README-03 | Phase 11 | Pending |
| README-04 | Phase 11 | Pending |
| README-05 | Phase 11 | Pending |

**Coverage:**
- v1.1 requirements: 20 total
- Mapped to phases: 20 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 — traceability populated after roadmap creation*
