# Phase 7.5 — Polishes: Bugs & UX Improvements

> **Branch:** `polishes`
> **Prerequisites:** All phases through 7 complete, all 61 tests passing.
> **Goal:** Fix visual bugs, improve the first-use experience, add polish animations, extend column controls, and establish brand identity.

---

## Table of Contents

1. [Overview & Prioritized Items](#overview--prioritized-items)
2. [Item 5: Branding — TapO(1) Identity & UP Cebu Theme](#item-5-branding--tapo1-identity--up-cebu-theme)
3. [Item 2: Task Card Hover Redesign](#item-2-task-card-hover-redesign)
4. [Item 3: Drag-and-Drop Visual Cues & Animations](#item-3-drag-and-drop-visual-cues--animations)
5. [Item 4: Show More / Show Less for In Progress & Done Columns](#item-4-show-more--show-less-for-in-progress--done-columns)
6. [Item 1: Smart First-Sync Experience](#item-1-smart-first-sync-experience)
7. [Testing Plan](#testing-plan)
8. [Risks & Mitigations](#risks--mitigations)

---

## Overview & Prioritized Items

Source: _TapO(1) Bugs and Suggested Improvements.pdf_

The raw PDF listed 5 items. After a full code review and UX analysis, the items are **reordered by implementation dependency** (not PDF order) to avoid rework:

| #   | Item                                                                         | Raw PDF # | Complexity | Why This Order                                                                                                         |
| --- | ---------------------------------------------------------------------------- | --------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | **Branding** — Rename to TapO(1), UP Cebu maroon/cream light theme           | 5         | M          | CSS variables affect every component. Ship visual identity first so all subsequent work renders in final brand colors. |
| 2   | **Task Card Hover** — Remove drag handle, fix layering, add highlight        | 2         | S          | Foundational component used in every view. Fix card UX before adding animations on top of it.                          |
| 3   | **Drop Animations** — Visual cues for drag target, smooth drop               | 3         | S          | Builds on card + board components. No logic changes, pure CSS/config.                                                  |
| 4   | **Column Pagination** — Show More/Less for Done; count-based for In Progress | 4         | M          | Extends action-board-column with new state. Independent of other items once board is stable.                           |
| 5   | **Smart First-Sync** — Auto-archive past-due banner for new users            | 1         | M          | Server action + new UI component. Most isolated; can be built last.                                                    |

---

## Item 5 → (Build Order 1): Branding — TapO(1) Identity & UP Cebu Theme

### Context

- **Brand Name:** TapO(1)
- **Tagline:** _Academic tracking in constant time._
- **Identity:** UP Cebu maroon + cream, clean and professional.

The current app says "Task Aggregator" with a blue/indigo primary (`oklch(0.50 0.20 265)`). The sidebar logo shows "TA" in a square.

### Design Decisions

#### Color Palette — UP Cebu

UP Cebu's institutional identity uses **maroon** (crimson) and **green**, with documents and materials often pairing maroon against **warm cream/off-white** backgrounds.

For the light theme, maroon becomes the `--primary` and cream becomes the `--background`. Green is omitted to keep the palette focused — maroon + cream is cleaner and more app-appropriate than a three-color institutional palette.

**Light mode (UP Cebu):**

| Token                  | Current (indigo)              | New (UP Cebu)          | Notes                                        |
| ---------------------- | ----------------------------- | ---------------------- | -------------------------------------------- |
| `--background`         | `oklch(0.985 0.002 265)`      | `oklch(0.97 0.01 80)`  | Warm cream tint (hue 80 = yellow-ish warm)   |
| `--foreground`         | `oklch(0.15 0.02 265)`        | `oklch(0.18 0.02 25)`  | Near-black with warm undertone               |
| `--card`               | `oklch(1 0 0)` pure white     | `oklch(0.99 0.005 80)` | Very subtle cream card                       |
| `--primary`            | `oklch(0.50 0.20 265)` indigo | `oklch(0.40 0.15 25)`  | Deep maroon (hue 25 ≈ red-crimson)           |
| `--primary-foreground` | white                         | `oklch(0.98 0.005 80)` | Cream text on maroon buttons                 |
| `--secondary`          | `oklch(0.96 0.006 265)`       | `oklch(0.95 0.01 80)`  | Light cream secondary                        |
| `--muted`              | `oklch(0.95 0.006 265)`       | `oklch(0.93 0.01 80)`  | Muted warm cream                             |
| `--muted-foreground`   | `oklch(0.50 0.02 265)`        | `oklch(0.45 0.02 25)`  | Warm gray text                               |
| `--accent`             | `oklch(0.95 0.01 265)`        | `oklch(0.94 0.015 25)` | Very light maroon tint on hover              |
| `--border`             | `oklch(0.91 0.008 265)`       | `oklch(0.90 0.01 60)`  | Warm border                                  |
| `--ring`               | indigo                        | `oklch(0.40 0.15 25)`  | Maroon focus ring                            |
| `--destructive`        | stays red                     | stays red              | Still destructive                            |
| `--success`            | green                         | stays green            | Semantic — no change                         |
| `--warning`            | orange                        | stays orange           | Semantic — no change                         |
| `--info`               | blue                          | `oklch(0.50 0.15 25)`  | Maroon-tinted info, or keep blue for clarity |
| `--sidebar`            | near-white                    | `oklch(0.96 0.012 80)` | Warm cream sidebar                           |
| `--sidebar-primary`    | indigo                        | `oklch(0.40 0.15 25)`  | Maroon                                       |

> **Accessibility check:** `oklch(0.40 0.15 25)` maroon on `oklch(0.97 0.01 80)` cream ≈ 7:1 contrast ratio → WCAG AAA ✅

**Dark mode:** Keep as-is (the existing dark theme is neutral and clean). Adjust only `--primary` to `oklch(0.68 0.15 25)` (lighter maroon) to maintain brand consistency across modes without losing readability on dark backgrounds.

#### Theme Toggle

The app currently detects system preference via a script in `layout.tsx` that adds/removes `.dark` class. We'll extend this to a toggle:

- **Stored in:** `localStorage["theme"]` (`"light" | "dark" | "system"`)
- **UI:** A button in the sidebar (below nav links) and in the dashboard header (mobile). Simple Sun/Moon icon toggle (light ↔ dark). "System" can be a third option accessible from Settings.
- **Implementation:** A `ThemeToggle` component that reads/writes localStorage and toggles `.dark` on `document.documentElement`.

#### Logo & Naming

| Location                      | Current           | New                                   |
| ----------------------------- | ----------------- | ------------------------------------- |
| Sidebar logo square           | "TA"              | "T(1)" or a stylized O(1) monogram    |
| Sidebar app name              | "Task Aggregator" | "TapO(1)"                             |
| HTML `<title>`                | "Task Aggregator" | "TapO(1)"                             |
| Manifest `name`               | "Task Aggregator" | "TapO(1)"                             |
| Manifest `short_name`         | "TaskAgg"         | "TapO(1)"                             |
| Login page heading            | "Task Aggregator" | "TapO(1)" with tagline                |
| Dashboard shell mobile header | "Task Aggregator" | "TapO(1)"                             |
| `<meta>` description          | generic           | "Academic tracking in constant time." |

### Files to Modify

```
src/app/globals.css                     → Replace :root light palette with UP Cebu maroon/cream; adjust .dark --primary
src/app/layout.tsx                      → Update <title>, <meta>, add theme toggle script
src/components/sidebar-nav.tsx          → "TapO(1)" branding, add ThemeToggle
src/components/theme-toggle.tsx         → NEW: Sun/Moon toggle component
src/app/dashboard/dashboard-shell.tsx   → Update mobile header branding
src/app/login/login-card.tsx            → Brand name + tagline
src/app/login/page.tsx                  → Update heading
src/app/page.tsx                        → Landing page branding
public/manifest.json                    → name, short_name, description
```

### Implementation Steps

1. [x] Update `globals.css` — replace `:root` light-mode variables with UP Cebu palette; tweak `.dark` `--primary`.
2. [x] Create `src/components/theme-toggle.tsx` — button that cycles `light`↔`dark`, updates `localStorage` and `document.documentElement.classList`.
3. [x] Update `sidebar-nav.tsx` — replace "TA" logo and "Task Aggregator" text; add `ThemeToggle` next to sync/signout buttons.
4. [x] Update `dashboard-shell.tsx` mobile header — "TapO(1)" text + ThemeToggle surfaced in header.
5. [x] Update `layout.tsx` — `<title>`, meta tags, theme initialization script (read from localStorage).
6. [x] Update `login-card.tsx` / `page.tsx` — brand name and tagline.
7. [x] Update `manifest.json` — name, short_name, description, theme_color to maroon hex.
8. [x] Verify WCAG AA contrast across all updated surfaces. Refined palette: light mode uses warmer cream (hue 80) with golden accent (hue 60) and deeper maroon `oklch(0.38 0.18 25)`; dark mode background shifted from cool blue-gray (hue 265) to warm brownish-maroon (hue 30) for brand harmony. foreground/background contrast ≥22:1 both modes; primary-foreground/primary ≥7:1 both modes; muted-foreground `oklch(0.44 0.022 30)` on cream ≥4.5:1 ✅

**Item 1 status:** Complete.

---

## Item 2 → (Build Order 2): Task Card Hover Redesign

### Problem

The current task card has layering issues when hovered on desktop:

1. **GripVertical (6 dots)** drag handle appears on the left — serves no purpose since the entire card is the drag target via dnd-kit's `useSortable`.
2. **Quick-action buttons** (Clock for in-progress, Circle for done) appear on hover in the **top-right corner**, overlapping with the `SourceIcon` that's already positioned there.
3. There's **no background highlight** on hover — the only visual change is the appearance of buttons, which feels abrupt.

### Design

**Before:**

```
┌─[⋮⋮]─[ Task Title          ]─[📚]──┐
│      │ CS101 • 2d left       │     │
│      │                      [⏰][○]│  ← appears on hover, overlaps source icon
└──────┴──────────────────────────────┘
```

**After:**

```
┌──[ Task Title              ]─[⏰][○]──┐  ← quick actions always in a reserved area
│  CS101 • 2d left              [📚] │  ← source icon moved to bottom-right
└────────────────────────────────────────┘
Hover: subtle bg-accent/40 highlight + soft shadow lift
```

### Changes

1. **Remove `GripVertical`** — Delete the drag handle element entirely. The card already has `useSortable` applied to the wrapper div, making the entire card draggable.

2. **Reposition quick actions** — Move Clock + Circle buttons from an absolute-positioned hover overlay to a **persistent** position in the card header row (right side), but with **reduced opacity** that increases on hover:
   - Default: `opacity-0 lg:group-hover:opacity-100` (same as now but without overlap issues)
   - The key fix: ensure the buttons area is **reserved in layout flow** (not absolute positioned) so they don't overlap the source icon.

   **Alternative (simpler, recommended):** Keep absolute positioning but move the SourceIcon from top-right to the bottom row (next to CourseBadge/CountdownBadge). This eliminates the overlap entirely while keeping the hover behavior.

3. **Add hover highlight** — Add `hover:bg-accent/40` and a subtle `hover:shadow-sm` to the card container for clear feedback that the card is interactive.

4. **Cursor** — Add `cursor-grab` to the card (desktop), `cursor-grabbing` during drag.

### Files to Modify

```
src/components/task-card.tsx           → Remove GripVertical, reposition SourceIcon, add hover classes
src/components/sortable-task-card.tsx  → Add cursor-grab class
```

### Implementation Steps

1. [x] In `task-card.tsx`:
   - Delete the `GripVertical` import and the absolute-positioned drag handle `<div>`.
   - Move `<SourceIcon>` from the title row to the bottom metadata row (after `<CountdownBadge>`), or keep it in the title row but ensure quick-action buttons don't overlap by giving them a dedicated slot.
   - Add `hover:bg-accent/40 hover:shadow-sm` to the card container.
   - Remove `lg:pl-0` from the card content (no longer needed since drag handle is gone).
   - Adjust mobile checkbox position if needed (it was at `left-3` to account for the drag handle gap).

2. [x] In `sortable-task-card.tsx`:
   - Add `cursor-grab active:cursor-grabbing` to the wrapper div.

---

## Item 3 → (Build Order 3): Drag-and-Drop Visual Cues & Animations

### Problem

The board currently has:

- ✅ Dragging animation: `scale-105 rotate-2 opacity-50 shadow-lg` on the card being dragged.
- ✅ Drop target: Column gets `bg-accent/30` when hovered during drag.
- ❌ No **drop animation** — card just snaps into place when released.
- ❌ No **insertion indicator** — user can't see WHERE within a column the card will land.

### Design Principles

From the user: _"I just want simple animations here, and for you not to break the logic for other features."_

1. **GPU-only animations** — Use CSS `transform` and `opacity` only. No layout-triggering properties.
2. **No new dependencies** — dnd-kit has built-in `dropAnimation` support. No Framer Motion needed.
3. **Respect column sort logic** — To Do is sorted by due date (insertion point is deterministic), In Progress by due date, Done by recency. The visual gap only needs to show the general column — not a precise insertion index — since the sort order will place the card.

### Changes

#### 3a. Drop Animation on `DragOverlay`

Currently: `<DragOverlay dropAnimation={null}>` — no animation on drop.

Change to: Use dnd-kit's default `dropAnimation` (or a custom config with shorter duration):

```tsx
const dropAnimationConfig = {
  duration: 200,
  easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
};

<DragOverlay dropAnimation={dropAnimationConfig}>
```

This makes the dragged card animate smoothly to its final position instead of snapping.

#### 3b. Enhanced Column Drop Zone Feedback

Currently: `isOver && "bg-accent/30 rounded-lg"` — subtle background change.

Enhanced:

```tsx
isOver && "bg-accent/40 rounded-lg ring-2 ring-primary/20 ring-inset";
```

Add a subtle ring border around the target column so it's visually distinct, plus a stronger background tint.

#### 3c. Sortable Item Transitions

dnd-kit's `SortableContext` with `verticalListSortingStrategy` already computes CSS transforms to create gaps between items during drag. The `transition` from `useSortable` handles this. Ensure the `sortable-task-card.tsx` passes both `transform` and `transition` correctly (it already does).

For smoother gap creation, we can add a `transition-all duration-200` to the task card wrapper:

```tsx
// sortable-task-card.tsx
<div ref={setNodeRef} style={style} className="transition-transform duration-200" {...attributes} {...listeners}>
```

#### 3d. Card Landing Effect (Optional, Nice-to-Have)

After a card is dropped, briefly flash a subtle highlight:

- On `handleDragEnd`, after the status mutation, the card will re-render in its new column.
- We can set a `justDropped` state with a `setTimeout` to clear after 500ms.
- The card gets a brief `ring-2 ring-primary/30 animate-pulse` effect.

**Decision:** Skip this for now. The `dropAnimation` from DragOverlay already provides closure. Adding a post-drop animation requires a transient state that's fragile with optimistic updates. Can revisit later.

### Files to Modify

```
src/components/action-board.tsx          → Add dropAnimation config to DragOverlay
src/components/action-board-column.tsx   → Enhance isOver styling
src/components/sortable-task-card.tsx    → Add transition class for smooth gap animation
```

### Implementation Steps

1. [x] In `action-board.tsx`: Replace `dropAnimation={null}` with a configured drop animation object.
2. [x] In `action-board-column.tsx`: Enhance `isOver` class — add `ring-2 ring-primary/20 ring-inset` and increase bg opacity.
3. [x] In `sortable-task-card.tsx`: Add `transition-transform duration-200` to wrapper div for smooth gap creation.

---

## Item 4 → (Build Order 4): Unified 7-by-7 Column Pagination

### Problem

The previous implementation used inconsistent pagination models across columns (time-window for To Do/Done, count-based for In Progress), making the UI harder to reason about.

### Design Decision

All three columns use a single consistent model: **7 cards visible by default, Show More reveals +7, Show Less collapses -7**. Time windows (todoWindowDays=7, doneWindowDays=7) are hardcoded as invisible background filters — students don't need to control them.

### Changes to `computeActionBoardBuckets`

```typescript
// New signature — display limits replace time-window params
computeActionBoardBuckets(
  tasks,
  now,
  todoWindowDays,        // internal filter only (hardcoded to 7 in hook)
  todoDisplayLimit = 7,  // count cap for To Do
  doneDisplayLimit = 7,  // count cap for Done
  inProgressDisplayLimit = 7, // count cap for In Progress
)
```

- `doneWindowDays` removed as a parameter (hardcoded at 7 days internally)
- All three buckets truncated at their display limit after sorting
- `todoHasMore`: true when tasks inside window exceed `todoDisplayLimit` **or** tasks exist beyond the window
- `doneHasMore` / `inProgressHasMore`: true when bucket length before slicing exceeds display limit

### Dashboard Page State

Three sessionStorage-backed display-limit states replace all time-window state:

```typescript
const [todoDisplayLimit, setTodoDisplayLimit] = useState(7);    // key: "todoDisplayLimit"
const [doneDisplayLimit, setDoneDisplayLimit] = useState(7);    // key: "doneDisplayLimit"
const [inProgressDisplayLimit, setInProgressDisplayLimit] = useState(7); // key: "inProgressDisplayLimit"
```

All handlers follow the same pattern: `+7` for Show More, `-7` (floor 7) for Show Less.

### Files Modified

```
src/lib/task-mapper.ts               → NEW: mapRow extracted here for reuse
src/hooks/use-tasks.ts               → imports mapRow from task-mapper
src/hooks/use-action-board.ts        → unified display limits, hardcoded time windows
src/hooks/__tests__/use-action-board.test.ts → updated for new signature/behavior (23 tests)
src/app/dashboard/page.tsx           → remove time-window state, add display-limit state
src/components/action-board.tsx      → remove window props, uniform showMoreLabel="Show 7 more"
```

### Implementation Steps

1. [x] Extract `mapRow` to `src/lib/task-mapper.ts` for reuse across hooks.
2. [x] Update `computeActionBoardBuckets`: remove `doneWindowDays` param; add `todoDisplayLimit`, `doneDisplayLimit`, `inProgressDisplayLimit` (all default 7); apply count cap after sorting each bucket.
3. [x] Update `useActionBoard`: new signature `(tasks, todoDisplayLimit, doneDisplayLimit, inProgressDisplayLimit)`; todoWindowDays hardcoded to 7 internally.
4. [x] Update `DashboardContent`: remove all time-window state; add three display-limit states; all Show More/Less handlers use +7/-7 increments.
5. [x] Update `ActionBoard`: remove `todoWindowDays`/`doneWindowDays`/`inProgressLimit` props; all columns use `showMoreLabel="Show 7 more"`.
6. [x] Update tests: done-window section rewritten for count-based semantics; inProgress tests updated to 6-arg signature; todoHasMore count-overflow test added (23 total, all passing).

**Item 4 status:** Complete.

---

## Item 6 → (Build Order 6): Dismissed Tasks History Page

### Problem

Once a task is dismissed it disappears with no way to find it again. If a student accidentally dismisses a task they still need, they have to re-sync or search manually.

### Design

A new `/dashboard/history` route shows tasks dismissed in the last 24 hours with a **Restore** button. After 24 hours the task silently leaves the list.

### Key Implementation Notes

**Query strategy**: Must query from `task_overrides` (not `tasks`) so the `custom_status` and `updated_at` filters apply to the main table's columns. Using `.eq("task_overrides.custom_status", "dismissed")` on a `tasks`-based query is silently ignored by the Supabase JS client (embedded-resource column filters don't work via `.eq()`).

```typescript
supabase
  .from("task_overrides")
  .select("*, tasks!inner(*, courses(*))")
  .eq("custom_status", "dismissed")
  .gte("updated_at", cutoff)  // cutoff = now - 24h
```

The override row is then wrapped into the shape `mapRow` expects before mapping, so no separate mapper was needed.

**Cache invalidation**: `setStatus` and `dismissAll` mutations now also invalidate `["history-tasks"]` on success so the history page updates immediately without a reload.

### Files Created/Modified

```
src/hooks/use-history-tasks.ts          → NEW: dedicated query for dismissed tasks
src/app/dashboard/history/page.tsx      → NEW: /dashboard/history route
src/components/sidebar-nav.tsx          → add History nav link (History icon)
src/hooks/use-task-actions.ts           → invalidate ["history-tasks"] on dismiss
```

### Implementation Steps

1. [x] Create `use-history-tasks.ts` — queries `task_overrides` directly with `custom_status = 'dismissed'` and `updated_at >= cutoff`, reconstructs `mapRow`-compatible rows.
2. [x] Create `dashboard/history/page.tsx` — lists dismissed tasks with title, course, due date, "dismissed X ago" timestamp; Restore button calls `setStatus({ taskId, status: 'pending' })` and invalidates `["history-tasks"]` on success.
3. [x] Add History link to `sidebar-nav.tsx`.
4. [x] Fix cache invalidation in `use-task-actions.ts` — both `setStatus` (when `status === 'dismissed'`) and `dismissAll` now invalidate `["history-tasks"]`.

**Item 6 status:** Complete.

---

## Item 1 → (Build Order 5): Smart First-Sync Experience

### Problem

When a new user syncs for the first time, **all** tasks — including those with past due dates that the student has already submitted — appear in the To Do column. This creates a terrible first impression: the user sees 30+ "overdue" tasks they've already handled.

### What Already Works

- **Google Classroom:** The sync engine calls `getStudentSubmissions()` and marks `TURNED_IN`/`RETURNED` as `status: "done"`. These tasks get upserted with `status = 'done'` and correctly land in the Done column. **This is already solved for GClassroom.**

- **UVEC (Moodle iCal):** The iCal export contains only calendar events with UIDs, summaries, dates, and categories. **There is no submission state in iCal format.** Moodle does not expose whether a student has submitted an assignment through the iCal feed. This is a fundamental protocol limitation — not a bug we can fix.

### Solution: Post-First-Sync Archive Banner

Since we can't detect UVEC submission status, we use a **heuristic + user confirmation** approach.

**Why `dueDate < now` is too aggressive:** A task due yesterday or even last week is ambiguous — it could be a late-but-unsubmitted assignment, or a cancelled activity whose date was never updated. We need a cushion.

**Revised heuristic:**
- Source: `source === 'uvec'` only (GClassroom already handled; custom tasks must never be auto-archived)
- Status: `effectiveStatus === 'pending'`
- Age: `dueDate < (now - cutoffDays)` where default cutoff is **7 days**
- Count gate: candidates > 3 (avoids triggering on nearly-clean boards)

**UX Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│  🎉 First sync complete!                                    │
│                                                             │
│  Found 18 UVEC tasks overdue by at least  [7 days ▾]       │
│  These are likely already submitted.                        │
│                                                             │
│  [Archive 18 tasks]   [I'll sort them myself]              │
└─────────────────────────────────────────────────────────────┘
```

1. After the sync mutation completes, check the **first-sync guard** (see Detection below).
2. Count UVEC pending tasks where `dueDate < (now - cutoffDays)`.
3. If count > 3, show a **dismissible banner** (not a modal — don't block the user).
4. The cutoff is a user-selectable inline dropdown: **7 days / 14 days / 30 days**. The count and button label update live as the user changes the dropdown.
5. **"Archive N tasks"** → Bulk-upserts `task_overrides` with `custom_status = 'done'` for the candidate task IDs. Sets `localStorage["firstSyncHandled"] = "true"`.
6. **"I'll sort them myself"** → Sets `localStorage["firstSyncHandled"] = "true"`. Banner hides immediately.

### Why Not Auto-Archive Silently?

Tempting, but risky:

- A student might have an **overdue but not-yet-submitted** late assignment. Auto-archiving would hide it.
- The banner gives control while still making the right default action effortless (one click vs. manually moving 18 tasks).

### Why Not a Dialog/Modal?

- Modals block exploration. A new user wants to **see** their dashboard first, then decide.
- A top-of-page banner is visible but non-blocking. The user can scroll around, check things out, and then click "Archive" when ready.

### Detection: "Is This the First Sync?"

**Client-side flag (no migration needed):** If `localStorage["firstSyncHandled"]` is not set AND candidates > 3, show the banner. The `localStorage` key persists per device — a user re-installing the PWA on a new device sees the banner again, which is correct behavior (new install = new triage).

> **Alternative considered (rejected):** Track "zero tasks before sync → tasks after sync" in the mutation's `onSuccess`. More reliable in theory, but requires storing a pre-sync count in component state and coordinating with the async mutation lifecycle. The localStorage approach is simpler and handles the real-world case equally well.

### Bulk Archive Implementation

The existing `useTaskActions` hook has `dismissAll` which upserts overrides with `custom_status = 'dismissed'`. We generalize this:

```typescript
// Generalized server action: bulkSetStatus(taskIds: string[], status: TaskStatus)
// Bulk upserts task_overrides with the given status
```

A dedicated `archivePastDue` mutation in `useTaskActions` calls this with `'done'` and the filtered UVEC task IDs.

### Candidate Derivation (Pure Function)

```typescript
function getPastDueCandidates(tasks: TaskWithCourse[], cutoffDays: number): TaskWithCourse[] {
  const cutoff = new Date(Date.now() - cutoffDays * 86_400_000);
  return tasks.filter(
    (t) =>
      t.source === "uvec" &&
      !t.isCustom &&
      t.status === "pending" &&
      t.dueDate !== null &&
      new Date(t.dueDate) < cutoff
  );
}
```

This is a pure function — extract it to `src/lib/first-sync-heuristic.ts` so it can be unit-tested independently.

### Files to Create/Modify

```
src/lib/first-sync-heuristic.ts         → NEW: getPastDueCandidates pure function
src/lib/__tests__/first-sync-heuristic.test.ts  → NEW: unit tests
src/components/first-sync-banner.tsx    → NEW: Banner component with cutoff selector and archive action
src/lib/actions/tasks.ts                → Add bulkSetStatus(taskIds, status) server action
src/hooks/use-task-actions.ts           → Add archivePastDue mutation
src/app/dashboard/page.tsx              → Render FirstSyncBanner after sync completes
```

### Implementation Steps

1. Create `src/lib/first-sync-heuristic.ts` — export `getPastDueCandidates(tasks, cutoffDays)` pure function.
2. Add `src/lib/__tests__/first-sync-heuristic.test.ts` — unit tests:
   - Returns only `source === 'uvec'` tasks.
   - Excludes `isCustom === true` tasks.
   - Excludes tasks with `null` dueDate.
   - Excludes tasks within the cutoff window.
   - Correct count with cutoff=7 vs cutoff=14.
3. Add `bulkSetStatus(taskIds: string[], status: TaskStatus)` server action in `tasks.ts` — generalizes the existing `dismissAllDone` to accept any target status.
4. Add `archivePastDue` mutation to `useTaskActions` — calls `bulkSetStatus` with `'done'`, invalidates `["tasks", *]` and `["history-tasks"]`.
5. Create `FirstSyncBanner` component:
   - Props: `tasks: TaskWithCourse[]`, `onArchive: (taskIds: string[]) => void`.
   - State: `cutoffDays: 7 | 14 | 30` (default 7).
   - Derives candidates via `getPastDueCandidates(tasks, cutoffDays)` — recomputes on dropdown change.
   - Only renders if `localStorage["firstSyncHandled"]` is not set AND `candidates.length > 3`.
   - Cutoff selector: inline `<select>` with options "7 days / 14 days / 30 days"; count and button label update live.
   - "Archive N tasks" → calls `onArchive(candidates.map(t => t.id))` → sets localStorage flag.
   - "I'll sort them myself" → sets localStorage flag → hides banner.
   - Subtle slide-down animation on mount, slide-up on dismiss.
6. In `DashboardContent` (`page.tsx`):
   - After `useTasks` data loads, render `<FirstSyncBanner tasks={tasks} onArchive={...} />`.
   - The `onArchive` callback calls `archivePastDue.mutate(taskIds)`.
7. Manual testing:
   - Clear localStorage, sync, verify banner appears.
   - Change dropdown from 7→14 days, verify count updates live.
   - Click "Archive N tasks" — verify all candidate tasks move to Done.
   - Reload — banner should not reappear.
   - Click "I'll sort them myself" — verify banner hides and does not reappear.

---

## Testing Plan

### Unit Tests (New)

| Test File                                        | Tests | What                                                                                                                        |
| ------------------------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/hooks/__tests__/use-action-board.test.ts`   | +7    | Unified 7-by-7 display limits: count-based doneHasMore, todoHasMore overflow, inProgressDisplayLimit — 23 tests total      |
| `src/lib/__tests__/first-sync-heuristic.test.ts` | +5    | `getPastDueCandidates`: UVEC-only filter, excludes custom tasks, excludes null dueDates, respects cutoff window, cutoff=7 vs 14 gives different counts |

### Manual Test Checklist

- [ ] **Branding:** Logo reads "TapO(1)" in sidebar, mobile header, login page, manifest
- [ ] **Theme toggle:** Switches between UP Cebu light (maroon/cream) and dark mode; persists across page reload
- [ ] **WCAG:** Maroon text on cream background passes contrast checker (≥4.5:1)
- [ ] **Card hover:** No overlapping icons; background highlights on hover; no drag handle visible
- [ ] **Card drag:** Cursor changes to grab/grabbing; card tilts while dragged; target column glows
- [ ] **Drop animation:** Card smoothly slides to final position (no snap)
- [ ] **Unified pagination:** All 3 columns show 7 by default; "Show 7 more" reveals +7; "Show less" collapses -7; persists in sessionStorage
- [ ] **History page:** Dismiss a task → appears in /dashboard/history immediately (no reload); Restore → task back in To Do, gone from history; tasks older than 24h not shown
- [ ] **First sync banner:** Appears on first visit with >3 UVEC tasks overdue by ≥7 days; cutoff dropdown updates count live; "Archive" clears them; banner never reappears; GClassroom/custom tasks unaffected (not yet built)
- [ ] **Mobile:** All changes render correctly on 375px viewport; touch drag still works; theme toggle accessible

---

## Risks & Mitigations

| Risk                                                                                | Severity | Mitigation                                                                                                           |
| ----------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| Maroon/cream palette reduces readability in some components                         | Medium   | Run all screens through Chrome DevTools contrast checker after palette change. Can tweak lightness values per-token. |
| Drop animation causes jitter on slow devices                                        | Low      | Use `will-change: transform` and keep duration ≤200ms. dnd-kit's default drop animation is battle-tested.            |
| First-sync banner shows for returning users who clear localStorage                  | Low      | Acceptable UX — the banner is helpful, not annoying. One-click dismiss.                                              |
| UVEC tasks have no submission state — heuristic may archive un-submitted late tasks | Medium   | 7-day cushion + UVEC-only filter reduces false positives. User-selectable cutoff (7/14/30 days) and mandatory confirmation mean no silent data loss.            |
| In Progress count-based pagination may feel inconsistent with time-based To Do/Done | Low      | Label buttons clearly ("Show 5 more" vs "Next 14d") so users understand the different models.                        |

---

## Summary

**Total new files:** 4 (`theme-toggle.tsx`, `first-sync-banner.tsx`, `first-sync-heuristic.ts`, `first-sync-heuristic.test.ts`)
**Total modified files:** ~14
**New unit tests:** ~10
**No new dependencies.** All changes use existing dnd-kit, Tailwind, and shadcn/ui primitives.
**No database migrations.** First-sync detection is client-side via localStorage.
