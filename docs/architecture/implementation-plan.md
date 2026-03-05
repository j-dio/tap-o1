# Task Aggregator — Implementation Plan

## Requirements Restatement

1. **Aggregate tasks** from UVEC (Moodle iCal) and Google Classroom into a single view
2. **Categorize** tasks by course, type (assignment/quiz/exam/event), and urgency
3. **Notify** students of upcoming deadlines via push notifications
4. **Support 10K students** on zero-cost infrastructure
5. **Mobile-first** PWA with desktop support
6. **Auto-sync** tasks periodically; manual refresh available
7. **Personal** — Each student sees only their own tasks with RLS

---

## Implementation Phases

### Phase 0: Project Scaffolding (Size: S — ~2 hours)

- [x] Initialize Next.js 15 with App Router, TypeScript strict mode
- [x] Install dependencies: Tailwind CSS, shadcn/ui, TanStack Query, Supabase client
- [x] Configure PWA (next-pwa or Serwist) with manifest.json
- [x] Set up Supabase project (Auth, Database, Edge Functions)
- [x] Configure Google Cloud Console (OAuth consent screen, Classroom API)
- [x] Set up environment variables (.env.local)
- [x] Create CI/CD: deploy to Vercel on push to `main`

**Files:**

```
package.json, tsconfig.json, next.config.ts, tailwind.config.ts,
.env.local, .env.example, public/manifest.json
```

### Phase 1: Authentication & Onboarding (Size: M — ~4 hours)

- [x] Supabase Auth with Google OAuth (request classroom.\* scopes)
- [x] Auth middleware (protect dashboard routes)
- [x] Login page with "Sign in with Google" button
- [x] Onboarding flow: UVEC iCal URL input + instructions
- [x] Profile table migration + RLS policies
- [x] Store UVEC URL in profile, Google tokens in Supabase Auth

**Files:**

```
src/app/(auth)/login/page.tsx
src/app/(auth)/onboarding/page.tsx
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/middleware.ts
supabase/migrations/001_profiles.sql
```

### Phase 2: Data Ingestion — UVEC (Size: M — ~4 hours)

- [x] Supabase Edge Function: CORS proxy for iCal URL
- [x] iCal parser: .ics text → Task[] (using ical.js)
- [x] UVEC service: fetch + parse + normalize
- [x] Task + Course table migrations + RLS
- [x] Upsert logic (dedup by source + external_id)
- [x] Unit tests for iCal parser with sample .ics data

**Files:**

```
src/lib/parsers/ical-parser.ts
src/services/uvec-service.ts
supabase/functions/uvec-proxy/index.ts
supabase/migrations/002_courses_tasks.sql
src/lib/parsers/__tests__/ical-parser.test.ts
```

### Phase 3: Data Ingestion — Google Classroom (Size: M — ~4 hours)

- [x] Google Classroom API client (courses, courseWork, announcements)
- [x] GClassroom parser: API response → Task[]
- [x] Sync engine: orchestrate both sources, handle errors gracefully
- [x] Unit tests for GClassroom parser
- [x] Integration test for sync engine

**Status:** Complete. Backend ingestion, parsing, and sync logic for Google Classroom is implemented and tested. UI integration and end-to-end testing will occur in Phase 4.

**Files:**

```
src/services/gclassroom-service.ts
src/lib/parsers/gclassroom-parser.ts
src/lib/sync-engine.ts
src/lib/parsers/__tests__/gclassroom-parser.test.ts
src/lib/__tests__/sync-engine.test.ts
```

### Phase 4: Dashboard UI (Size: L — ~6 hours)

- [x] Design tokens — indigo/blue OKLch palette, semantic tokens (success/warning/info), sidebar tokens, chart colors in `globals.css`
- [x] Install shadcn/ui components — tabs, dialog, skeleton, separator, tooltip, dropdown-menu, scroll-area, sheet, avatar, select
- [x] Dashboard layout — sidebar (desktop) + sheet drawer (mobile), `dashboard-shell.tsx` rewritten, `layout.tsx` updated
- [x] Today view — board with urgency columns (Overdue / Due Today / This Week / Later), `Suspense` boundary for `useSearchParams`
- [x] Week view — 7-day columns, prev/next week navigation, `dashboard/week/page.tsx`
- [x] Task card component — urgency left-border, course badge, countdown, source icon, opens detail modal
- [x] Task detail modal — full title, description, course, due date, source link, type/status
- [x] Filter bar — course, source, type filters persisted in URL search params
- [x] Empty states — `empty-state.tsx` with Lucide icon, title, description, optional CTA
- [x] Sync button — spins during sync, invalidates TanStack Query caches on success
- [x] Data hooks — `use-tasks.ts`, `use-courses.ts`, `use-sync.ts`
- [x] Server action — `src/lib/actions/sync.ts` (upserts courses then tasks, handles Google token, returns `{ synced, errors }`)
- [x] Utility functions — `getTaskUrgency`, `groupTasksByUrgency`, `groupTasksByDay`, `getCourseColor`, `getWeekStart`, `getWeekDays`, `formatDayLabel`, `isSameDay` added to `utils.ts`
- [x] Types — `TaskWithCourse`, `TaskUrgency`, `TaskOverride` added to `task.ts`; `ParsedTask` intermediate type used by both parsers
- [x] UI components — `course-badge.tsx`, `countdown-badge.tsx`, `source-icon.tsx`, `sidebar-nav.tsx`, `task-board.tsx`, `task-list.tsx`, `task-filters.tsx`, `task-detail-modal.tsx` all created
- [x] Dark mode — dark mode detection script in `layout.tsx`, semantic tokens used throughout
- [x] Bug fix — `use-tasks.ts` was overriding QueryProvider globals with `staleTime: 60s` and `refetchOnWindowFocus: true` (regression from scalability fix); removed to defer to global `staleTime: 5min` / `refetchOnWindowFocus: false`
- [x] `view-toggle.tsx` — mobile segmented Today/Week switcher
- [x] `use-pull-to-refresh.ts` — touch gesture hook for mobile pull-to-refresh
- [x] Landing page, login, onboarding — verified all zinc-\* references replaced with semantic tokens

**Files:**

```
src/app/dashboard/layout.tsx
src/app/dashboard/page.tsx
src/app/dashboard/week/page.tsx
src/app/dashboard/dashboard-shell.tsx
src/components/task-card.tsx
src/components/task-board.tsx
src/components/task-list.tsx
src/components/task-filters.tsx
src/components/task-detail-modal.tsx
src/components/course-badge.tsx
src/components/countdown-badge.tsx
src/components/source-icon.tsx
src/components/sync-button.tsx
src/components/empty-state.tsx
src/components/sidebar-nav.tsx
src/components/view-toggle.tsx
src/hooks/use-tasks.ts
src/hooks/use-courses.ts
src/hooks/use-sync.ts
src/hooks/use-pull-to-refresh.ts
src/lib/actions/sync.ts
```

### Phase 5: Task Management (Size: M — ~3 hours)

- [x] Mark task as done / dismiss
- [x] Set priority (low/medium/high/urgent)
- [x] Add personal notes to tasks
- [x] Task overrides table migration
- [x] Auto-detect overdue tasks (due_date < now && status = pending)
- [x] "Open in UVEC/GClassroom" deep link button

**Status:** Complete. Task overrides now persist per-user task management state (status, priority, notes) without mutating source data. Overdue is derived client-side from pending + due_date in the past.

> **Bug discovered post-merge:** `supabase/migrations/003_task_overrides.sql` was never applied to the production Supabase project, causing all task action buttons (mark done, dismiss, reset, priority, notes) to return 404 errors from PostgREST. Fixed in Phase 5.6 by applying the migration directly. No application code was affected.

**Files:**

```
src/components/task-actions.tsx
supabase/migrations/003_task_overrides.sql
src/hooks/use-task-actions.ts
src/hooks/use-tasks.ts
src/components/task-filters.tsx
src/components/task-detail-modal.tsx
```

### Phase 5.5: Enhanced Features & Polish (Size: M — ~4 hours)

**UI/UX Enhancements:**

- [x] NEW badge on task cards — animated pulse effect for tasks created within 5 minutes
- [x] Priority indicator system — visual badges (low/medium/high/urgent) on task cards
- [x] Urgency-based visual hierarchy — color-coded left borders on cards:
  - Red: Overdue
  - Orange: Urgent
  - Cyan: Due soon (this week)
  - Grey: Later
- [x] Toast notification system — integrated Sonner for real-time sync feedback and task actions
- [x] Mobile-responsive enhancements:
  - Pull-to-refresh gesture detection with threshold-based triggering
  - Mobile sidebar navigation with hamburger menu
  - Device-specific view toggle (Today/Week)
  - Touch event binding with proper cancellation handling
  - Responsive grid layouts using Tailwind CSS

**State Management & Performance:**

- [x] Auto-sync cooldown mechanism — 5-minute throttle prevents server load while maintaining freshness
- [x] Stale time optimization — 5-minute stale time for task queries with query invalidation on mutations
- [x] React Query integration — `useTasks()` hook with flexible filtering (source, type, course, status)
- [x] Custom sync hooks:
  - `useAutoSync()`: Automatic sync when data is stale (>1 hour), respecting 5-minute cooldown
  - `usePullToRefresh()`: Touch gesture handling for mobile refresh
  - `useTaskActions()`: Mutations for status, priority, and notes management
  - `useSync()`: Central sync orchestration with cooldown management

**Advanced Filtering & Sorting:**

- [x] Enhanced filter bar with multiple persistent filters:
  - Source filtering (UVEC/Google Classroom)
  - Type filtering (assignment, quiz, exam, event, announcement)
  - Course filtering with dynamic dropdown
  - Status filtering including "overdue" display status
- [x] Sort dropdown — tasks sortable by due-date, priority, type, and title
- [x] URL-based state persistence — filters bookmarkable and shareable
- [x] Grouping system with urgency buckets:
  - Overdue, Today, This Week, Later columns with task count badges
  - Conditional bucket logic based on active status filters
  - Scroll areas for horizontal board layout

**Data Integrity & Error Handling:**

- [x] Graceful fallbacks — handles missing task_overrides table with safe error recovery
- [x] Partial sync success — continues operation without failing on per-source errors
- [x] Toast-based error messaging — user-friendly error descriptions
- [x] Type safety improvements:
  - `TaskWithCourse` type for joined database queries
  - `TaskDisplayStatus` extending `TaskStatus` for overdue semantic distinctions
  - `TaskUrgency` enum for clear urgency classification
  - `ParsedTask` intermediate type used by both UVEC and GClassroom parsers

**Service Architecture:**

- [x] Dual-source deduplication — prevent task duplication by `source:externalId` combination
- [x] Parallel fetching with error recovery — `Promise.allSettled()` for resilient multi-source ingestion
- [x] Token refresh strategy — automatic Google OAuth token refresh with fallback handling
- [x] Sync engine orchestration — `syncAllTasks()` server action for secure token handling

**Additional Features:**

- [x] Relative date formatting — human-readable time indicators ("in 2h", "3d ago", etc.)
- [x] Course color assignment — deterministic hashing for consistent visual identification
- [x] Dark mode support — CSS variable-based theming with system preference detection
- [x] External links — direct links to source platforms (Google Classroom / UVEC Moodle)

**Status:** Complete. All phase 5.5 enhancements have been implemented and integrated into the dashboard, improving both user experience and system reliability.

**Files:**

```
src/components/task-card.tsx
src/components/task-board.tsx
src/components/sync-button.tsx
src/hooks/use-sync.ts
src/hooks/use-pull-to-refresh.ts
src/hooks/use-task-actions.ts
src/hooks/use-auto-sync.ts
src/components/task-filters.tsx
src/lib/sync-engine.ts
src/services/gclassroom-service.ts
src/services/uvec-service.ts
src/lib/parsers/ical-parser.ts
src/lib/parsers/gclassroom-parser.ts
src/lib/actions/sync.ts
src/types/task.ts
```

### Phase 5.6: Bug Fixes & Submission Sync (Size: S — fixes branch)

**Bug Fixes:**

- [x] Apply `003_task_overrides.sql` migration to production — resolves all 5 task action failures (mark done, dismiss, reset, set priority, save notes) that returned 404 from PostgREST due to missing table
- [x] Reset button behavior confirmed correct — sets `custom_status` back to `"pending"` via `task_overrides` upsert, no code change required

**Overdue & Later Date-Window Filtering:**

- [x] Add `overdueWindowDays` (default 30) and `laterWindowDays` (default 60) to `TaskFilters`
- [x] Applied as a single server-side `.or()` filter on `due_date` — tasks outside the window are never fetched (null due_date always included)
- [x] "Show older" button at the bottom of Overdue and Later columns expands the respective window by 30 days per click
- [x] Window state managed in the dashboard page with `useState`; callbacks passed down to `TaskBoard`; both the primary and PGRST200-fallback query paths apply the same filter

**Google Classroom Submission Auto-Mark:**

- [x] Add `getStudentSubmissions(courseId)` to `GClassroomService` using the wildcard endpoint `courseWork/-/studentSubmissions?userId=me` — fetches all submissions for a course in one request; failure is non-critical (tasks sync without status if endpoint errors)
- [x] Submission fetch runs in parallel with `getCourseWork` per course inside `Promise.allSettled`; retry path on token expiry also includes submissions
- [x] `parseGClassroomResponse` accepts optional `submissionMap: Map<string, string>` (courseWorkId → state); sets `status: "done"` for `TURNED_IN`/`RETURNED`, `status: "pending"` for any other known state
- [x] Add optional `status?: TaskStatus` to `ParsedTask` interface so parsers can signal platform-level completion
- [x] Task upsert in `syncAllTasks` conditionally includes `status` only when the parser explicitly set it — existing status is preserved otherwise

**Status:** Complete. All reported bugs resolved; overdue backlog is now bounded by a rolling 30-day window; submitted Google Classroom assignments are automatically marked done on next sync.

**Files:**

```
supabase/migrations/003_task_overrides.sql  (applied to production)
src/hooks/use-tasks.ts
src/app/dashboard/page.tsx
src/components/task-board.tsx
src/types/task.ts
src/services/gclassroom-service.ts
src/lib/parsers/gclassroom-parser.ts
src/lib/sync-engine.ts
src/lib/actions/sync.ts
```

### Phase 6: Notifications & Reminders (Size: M — ~4 hours)

- [x] Service Worker push event handler — handles `push` events, renders notifications with title/body/icon/badge, opens dashboard on click
- [x] VAPID key pair via env vars — `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (client) + `VAPID_PRIVATE_KEY` (server), never hardcoded
- [x] Push subscription table migration — `push_subscriptions` (user_id, endpoint, p256dh, auth, created_at) with RLS; `notification_log` (user_id, task_id, sent_at, type) with unique constraint to prevent duplicate notifications
- [x] Subscribe/Unsubscribe server actions — `subscribePush()` validates with Zod, upserts to DB, sets `notification_enabled` on profile; `unsubscribePush()` deletes subscription and clears flag when no subscriptions remain
- [x] `usePushNotifications` hook — manages browser permission, subscribe/unsubscribe lifecycle, `urlBase64ToUint8Array` VAPID conversion, optimistic error handling with rollback
- [x] Settings UI notification toggle — `NotificationSettings` card in settings page with enable/disable button, permission-denied state, unsupported browser state, error display
- [x] Supabase Edge Function `send-due-reminders` — native Web Crypto VAPID JWT (ES256) + RFC 8291 content encryption (ECDH + HKDF + AES-128-GCM); queries tasks due within 24 hrs not yet notified; groups by user; sends push; logs to `notification_log`; auto-deletes stale subscriptions on 410 Gone
- [x] Zod validation schemas — `pushSubscriptionSchema` + `pushSubscriptionKeysSchema` with base64url regex validation
- [x] Unit tests — 13 tests for notification validation schemas (valid/invalid endpoints, keys, edge cases)

**Status:** Complete. Web Push notifications are fully implemented with native Deno Web Crypto for the Edge Function (no Node.js dependencies). Cron schedule to be configured in Supabase dashboard (every 15 minutes).

> **Deployment notes:**
>
> 1. Generate VAPID keys: `npx web-push generate-vapid-keys` and set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` in env vars
> 2. Apply migration: `006_push_subscriptions.sql`
> 3. Deploy Edge Function: `supabase functions deploy send-due-reminders`
> 4. Configure cron in Supabase dashboard: `*/15 * * * *` → `send-due-reminders`
> 5. Set `VAPID_SUBJECT` env in Supabase Edge Function secrets (e.g. `mailto:admin@yourdomain.com`)

**Files:**

```
supabase/migrations/006_push_subscriptions.sql
src/lib/validations/notifications.ts
src/app/sw.ts
src/lib/actions/notifications.ts
src/hooks/use-push-notifications.ts
src/components/notification-settings.tsx
src/app/dashboard/settings/page.tsx
supabase/functions/send-due-reminders/index.ts
supabase/functions/send-due-reminders/web-push.ts
src/lib/__tests__/notifications-validation.test.ts
```

### Phase 7: Polish & Launch (Size: M — ~4 hours)

- [ ] Offline support: service worker caches task data
- [ ] "Add to Home Screen" prompt + tutorial
- [ ] Calendar view (monthly overview)
- [ ] Export tasks to .ics file (for native calendar apps)
- [ ] Error boundaries + Sentry integration
- [ ] Landing page with feature highlights
- [ ] README.md with setup instructions
- [ ] Deploy to production

**Files:**

```
src/app/(dashboard)/calendar/page.tsx
src/app/page.tsx (landing)
src/components/error-boundary.tsx
README.md
```

---

## Dependencies

| Dependency           | Purpose                            | Risk                                                    |
| -------------------- | ---------------------------------- | ------------------------------------------------------- |
| Supabase free tier   | Auth, DB, Edge Functions, Realtime | LOW — Well within limits for 10K users                  |
| Google Classroom API | Task data from GClassroom          | LOW — 4M queries/day free                               |
| UVEC iCal export     | Task data from Moodle              | MEDIUM — URL format may change; no official API         |
| Vercel free tier     | Frontend hosting                   | LOW — 100GB bandwidth sufficient                        |
| Google OAuth consent | Unverified app warning             | MEDIUM — Need to submit for verification for >100 users |

## Risks

| Severity   | Risk                                                                       | Mitigation                                                                                 |
| ---------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **HIGH**   | Google OAuth unverified app — Google shows scary warning to users over 100 | Submit for Google verification early (Phase 1). Use university domain for faster approval. |
| **HIGH**   | UVEC CORS blocks browser requests                                          | Edge Function proxy (already planned in Phase 2)                                           |
| **MEDIUM** | UVEC iCal URL format changes or tokens expire                              | Build resilient parser with error handling; prompt user to re-paste URL if fetch fails     |
| **MEDIUM** | Supabase Realtime 200 concurrent limit                                     | Use TanStack Query polling (every 60s) as primary; Realtime as enhancement only            |
| **LOW**    | iOS Web Push requires "Add to Home Screen"                                 | Show clear tutorial during onboarding                                                      |
| **LOW**    | Student doesn't know where to find iCal URL                                | In-app guide with screenshots                                                              |

## Estimated Timeline

| Phase                         | Effort        | Cumulative                 |
| ----------------------------- | ------------- | -------------------------- |
| Phase 0: Scaffolding          | 2h            | 2h                         |
| Phase 1: Auth & Onboarding    | 4h            | 6h                         |
| Phase 2: UVEC Ingestion       | 4h            | 10h                        |
| Phase 3: GClassroom Ingestion | 4h            | 14h                        |
| Phase 4: Dashboard UI         | 6h            | 20h                        |
| Phase 5: Task Management      | 3h            | 23h                        |
| Phase 5.5: Enhanced Features  | 4h            | 27h                        |
| Phase 5.6: Bug Fixes          | 1h            | 28h                        |
| Phase 6: Notifications        | 4h            | 32h                        |
| Phase 7: Polish & Launch      | 4h            | 36h                        |
| **Total**                     | **~36 hours** | **~3-4 weeks** (part-time) |

---

## Action Board — Bug Fixes & Polish (Phase 5.7)

### ✅ Completed

| #   | Change                                                                                         | Commit    |
| --- | ---------------------------------------------------------------------------------------------- | --------- |
| 1   | Done tasks disappear — `updatedAt` now uses `max(tasks.updated_at, task_overrides.updated_at)` | `df11613` |
| 2   | In-Progress capped at 1 — `kanbanCollision` strategy replaces `closestCorners`                 | `df11613` |
| 3   | Drag to Done blocked — `pointerWithin` + column-preference collision resolver                  | `df11613` |
| 4   | Todo window limited to 7 days (reduces noise)                                                  | `df11613` |
| 5   | Show More button — extends window by 7 days per click (max 56)                                 | `9e3ffa2` |
| 6   | Show Less button — collapses window by 7 days per click (floor 7)                              | `064a8ad` |
| 7   | `Date.now()` impure render error — replaced with `useState(Date.now)` lazy init                | `9e3ffa2` |
| 8   | Optimistic UI — drag/button moves card instantly; rolls back on server error                   | latest    |
| 9   | Per-column empty states — context-aware messages with icons per column                         | latest    |
| 10  | Todo window persisted in `sessionStorage` — survives page refresh within session               | latest    |
| 11  | `computeActionBoardBuckets` extracted as pure function for testability                         | latest    |
| 12  | 13 unit tests for `computeActionBoardBuckets` — all passing                                    | latest    |

### 🔲 Remaining / Deferred

| Priority | Item                             | Notes                                                                              |
| -------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| Low      | Animate Show More/Less expansion | Needs Framer Motion `AnimatePresence` or CSS grid trick; deferred to avoid new dep |
| Low      | Unit tests for `kanbanCollision` | Requires `jsdom` environment; vitest currently runs in `node`                      |

### 📐 Architecture Notes

- **Collision**: `kanbanCollision` → `pointerWithin` → column-preference → `rectIntersection` fallback
- **Window state**: `todoWindowDays` lives in `DashboardContent`, persisted to `sessionStorage["todoWindowDays"]`; threaded as `todoWindowDays` + `onShowMore` + `onShowLess`
- **Time anchor**: `useState(Date.now)` at mount — stable across re-renders within a session
- **Done visibility window**: 7 days from effective `updatedAt` (max of task + override timestamps)
- **Todo visibility window**: user-controlled 7–56 days; tasks with no due date always shown
- **Optimistic UI**: `onMutate` snapshots all `["tasks", *]` cache entries via `getQueriesData`; `onError` restores them; `onSuccess` confirms with `invalidateQueries`
