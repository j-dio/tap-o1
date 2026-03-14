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

## Item 4 → (Build Order 4): Show More / Show Less for In Progress & Done Columns

### Problem

Only the To Do column has Show More/Less buttons. In Progress and Done columns show all their tasks without pagination, which can be visually overwhelming.

### Design Analysis

| Column          | Current Behavior           | Window Strategy                | Rationale                                                                                                                      |
| --------------- | -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **To Do**       | 7–56 day window, paginated | Time-based (7d increments)     | ✅ Already implemented                                                                                                         |
| **In Progress** | All tasks shown            | **Count-based (5 at a time)**  | In-progress tasks don't have a natural time window. Students rarely have >7 tasks in progress. Show 5 by default, expand by 5. |
| **Done**        | Last 7 days shown          | **Time-based (7d increments)** | Mirrors To Do pattern. Expand from 7d → 14d → 21d → 28d. Students may want to review older completed tasks.                    |

### Changes to `computeActionBoardBuckets`

Currently the function populates 3 buckets. We need to add windowing metadata:

```typescript
export interface ActionBoardBuckets {
  todo: TaskWithCourse[];
  inProgress: TaskWithCourse[];
  done: TaskWithCourse[];
  todoHasMore: boolean;
  inProgressHasMore: boolean; // NEW
  doneHasMore: boolean; // NEW
}
```

**Done window:**

- Add `doneWindowDays` parameter (default 7)
- Filter done tasks by `updatedAt > now - doneWindowDays`
- Set `doneHasMore = true` if any done task was filtered out

**In Progress window:**

- Add `inProgressLimit` parameter (default 5)
- After sorting, slice to first `inProgressLimit` tasks
- Set `inProgressHasMore = true` if more exist beyond the limit

### Dashboard Page State

Add state for `doneWindowDays` and `inProgressLimit`, mirroring the existing `todoWindowDays` pattern:

```typescript
const [doneWindowDays, setDoneWindowDays] = useState(7);
const [inProgressLimit, setInProgressLimit] = useState(5);
```

Persist in `sessionStorage` with keys `"doneWindowDays"` and `"inProgressLimit"`.

### Column UI

`ActionBoardColumn` already accepts `onShowMore`, `onShowLess`, and `todoWindowDays` props — but they're currently hardcoded for the To Do column only. We need to **generalize** these props:

- Rename `todoWindowDays` → `windowLabel` (string, used for button label like "Next 14d")
- `onShowMore` / `onShowLess` already generic — just need to wire them up for all columns

For In Progress, the "Show more" button label would be "Show 5 more" instead of "Next 14d".

### Files to Modify

```
src/types/task.ts                      → Add inProgressHasMore, doneHasMore to ActionBoardBuckets
src/hooks/use-action-board.ts          → Accept doneWindowDays + inProgressLimit; compute new flags
src/hooks/__tests__/use-action-board.test.ts → New test cases for done/in-progress pagination
src/app/dashboard/page.tsx             → Add state for doneWindowDays, inProgressLimit; wire callbacks
src/components/action-board.tsx        → Pass new props through to columns
src/components/action-board-column.tsx → Generalize Show More/Less labels, render for all columns
```

### Implementation Steps

1. [x] Update `ActionBoardBuckets` type — add `inProgressHasMore: boolean` and `doneHasMore: boolean`.
2. [x] Update `computeActionBoardBuckets`:
   - Add `doneWindowDays` parameter (default 7). Filter done tasks by effective `updatedAt` window. Set `doneHasMore`.
   - Add `inProgressLimit` parameter (default 5). Slice in-progress array after sorting. Set `inProgressHasMore`.
3. [x] Update `useActionBoard` hook — accept and pass through the new parameters.
4. [x] Update `DashboardContent` in `page.tsx`:
   - Add `doneWindowDays` state (sessionStorage-backed, same pattern as `todoWindowDays`).
   - Add `inProgressLimit` state (sessionStorage-backed, default 5, increment/decrement by 5).
   - Create `handleShowMoreDone`, `handleShowLessDone`, `handleShowMoreInProgress`, `handleShowLessInProgress`.
5. [x] Update `ActionBoard` props — pass through done/in-progress show more/less callbacks and window metadata.
6. [x] Update `ActionBoardColumn`:
   - Make `Show more` / `Show less` buttons render for any column that provides `onShowMore` / `onShowLess`.
   - Use a `showMoreLabel` string prop for the button text (e.g., "Next 14d" for time-based, "Show 10 total" for count-based).
7. [x] Add unit tests for new windowing logic in `use-action-board.test.ts`.

---

## Item 1 → (Build Order 5): Smart First-Sync Experience

### Problem

When a new user syncs for the first time, **all** tasks — including those with past due dates that the student has already submitted — appear in the To Do column. This creates a terrible first impression: the user sees 30+ "overdue" tasks they've already handled.

### What Already Works

- **Google Classroom:** The sync engine calls `getStudentSubmissions()` and marks `TURNED_IN`/`RETURNED` as `status: "done"`. These tasks get upserted with `status = 'done'` and correctly land in the Done column. **This is already solved for GClassroom.**

- **UVEC (Moodle iCal):** The iCal export contains only calendar events with UIDs, summaries, dates, and categories. **There is no submission state in iCal format.** Moodle does not expose whether a student has submitted an assignment through the iCal feed. This is a fundamental protocol limitation — not a bug we can fix.

### Solution: Post-First-Sync Archive Banner

Since we can't detect UVEC submission status, we use a **heuristic + user confirmation** approach:

**Heuristic:** If `dueDate < now`, the task has very likely been submitted by an active student. This is especially true for a brand-new user whose first sync pulls in an entire semester's worth of tasks.

**UX Flow:**

```
┌─────────────────────────────────────────────────────┐
│  🎉 First sync complete!                            │
│                                                     │
│  We found 23 tasks with past due dates.             │
│  These are likely already submitted.                 │
│                                                     │
│  [Archive all past tasks]   [I'll sort them myself] │
└─────────────────────────────────────────────────────┘
```

1. After the sync mutation completes, check if this is the **first sync** for the user (zero tasks existed before sync → tasks exist now, OR a profile flag `first_sync_done`).
2. Count tasks where `status = 'pending'` AND `dueDate < now`.
3. If count > 0, show a **dismissible banner** (not a modal — don't block the user).
4. **"Archive all past tasks"** → Bulk-upserts `task_overrides` with `custom_status = 'done'` for all past-due pending tasks. Uses the existing `dismissAll` pattern from `use-task-actions.ts` but with `'done'` instead of `'dismissed'`.
5. **"I'll sort them myself"** → Dismisses the banner. Sets `localStorage["firstSyncHandled"] = "true"` so it never shows again.

### Why Not Auto-Archive Silently?

Tempting, but risky:

- A student might have an **overdue but not-yet-submitted** late assignment. Auto-archiving would hide it.
- The banner gives control while still making the right default action effortless (one click vs. manually moving 23 tasks).

### Why Not a Dialog/Modal?

- Modals block exploration. A new user wants to **see** their dashboard first, then decide.
- A top-of-page banner is visible but non-blocking. The user can scroll around, check things out, and then click "Archive" when ready.

### Detection: "Is This the First Sync?"

**Option A — Profile flag:** Add a `first_sync_done` boolean column to `profiles` table. Set it to `true` after the first sync. Check it on subsequent syncs.

**Option B — Client-side heuristic (simpler, no migration):** After sync, if `localStorage["firstSyncHandled"]` is not set AND the number of past-due pending tasks > 3, show the banner. This avoids a schema change while being reliable enough.

**Decision:** Go with **Option B** (client-side) for simplicity. No migration needed. The `localStorage` key persists per device, which is fine — a user re-installing the PWA on a new device would see the banner again (which is actually correct behavior since a new device = new install).

### Bulk Archive Implementation

The existing `useTaskActions` hook has `dismissAll` which upserts overrides with `custom_status = 'dismissed'`. We need a similar `archivePastDue` mutation that sets `custom_status = 'done'` for a batch of task IDs.

We can reuse the existing `dismissAllDone` server action pattern but with a different status:

```typescript
// New server action: archivePastDueTasks(taskIds: string[])
// Bulk upserts task_overrides with custom_status = 'done'
```

Or simply call `setStatus` in a loop — but a bulk action is more efficient.

### Files to Create/Modify

```
src/components/first-sync-banner.tsx    → NEW: Banner component with archive action
src/lib/actions/tasks.ts                → Add bulkArchivePastDue server action (or reuse dismissAllDone with status param)
src/hooks/use-task-actions.ts           → Add archivePastDue mutation
src/app/dashboard/page.tsx              → Render FirstSyncBanner after sync completes
```

### Implementation Steps

1. Add `bulkSetStatus(taskIds: string[], status: TaskStatus)` server action in `tasks.ts` — generalizes the existing `dismissAllDone` to accept any target status.
2. Add `archivePastDue` mutation to `useTaskActions` — calls `bulkSetStatus` with `'done'`.
3. Create `FirstSyncBanner` component:
   - Receives `tasks: TaskWithCourse[]` and `onArchive: () => void`.
   - Computes past-due pending count from tasks.
   - Only renders if `localStorage["firstSyncHandled"]` is not set AND past-due count > 3.
   - "Archive all past tasks" → calls `onArchive` → sets localStorage flag.
   - "I'll sort them myself" → sets localStorage flag → hides banner.
   - Subtle animation (slide-down) on mount, slide-up on dismiss.
4. In `DashboardContent` (`page.tsx`):
   - After `useTasks` data loads, pass tasks to `<FirstSyncBanner>`.
   - The `onArchive` callback calls `archivePastDue.mutate(pastDueTaskIds)`.
5. Manual testing:
   - Clear localStorage, sync, verify banner appears.
   - Click "Archive" — verify all past-due tasks move to Done.
   - Reload — banner should not reappear.

---

## Testing Plan

### Unit Tests (New)

| Test File                                        | Tests | What                                                                                                          |
| ------------------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------- |
| `src/hooks/__tests__/use-action-board.test.ts`   | +6    | Done window expansion (7d, 14d, 28d), `doneHasMore` flag, In Progress limit (5, 10), `inProgressHasMore` flag |
| `src/lib/__tests__/first-sync-heuristic.test.ts` | +4    | Past-due detection: counts correctly, ignores GClassroom done tasks, handles null due dates, threshold of 3   |

### Manual Test Checklist

- [ ] **Branding:** Logo reads "TapO(1)" in sidebar, mobile header, login page, manifest
- [ ] **Theme toggle:** Switches between UP Cebu light (maroon/cream) and dark mode; persists across page reload
- [ ] **WCAG:** Maroon text on cream background passes contrast checker (≥4.5:1)
- [ ] **Card hover:** No overlapping icons; background highlights on hover; no drag handle visible
- [ ] **Card drag:** Cursor changes to grab/grabbing; card tilts while dragged; target column glows
- [ ] **Drop animation:** Card smoothly slides to final position (no snap)
- [ ] **Done pagination:** "Show more" expands to 14d, then 21d; "Show less" collapses back
- [ ] **In Progress pagination:** Shows first 5; "Show 5 more" expands; "Show less" reduces
- [ ] **First sync banner:** Appears on first visit with >3 past-due tasks; "Archive" clears them; banner never reappears
- [ ] **Mobile:** All changes render correctly on 375px viewport; touch drag still works; theme toggle accessible

---

## Risks & Mitigations

| Risk                                                                                | Severity | Mitigation                                                                                                           |
| ----------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| Maroon/cream palette reduces readability in some components                         | Medium   | Run all screens through Chrome DevTools contrast checker after palette change. Can tweak lightness values per-token. |
| Drop animation causes jitter on slow devices                                        | Low      | Use `will-change: transform` and keep duration ≤200ms. dnd-kit's default drop animation is battle-tested.            |
| First-sync banner shows for returning users who clear localStorage                  | Low      | Acceptable UX — the banner is helpful, not annoying. One-click dismiss.                                              |
| UVEC tasks have no submission state — heuristic may archive un-submitted late tasks | Medium   | This is why we use a banner (user-confirmed) rather than auto-archive. The user makes the final decision.            |
| In Progress count-based pagination may feel inconsistent with time-based To Do/Done | Low      | Label buttons clearly ("Show 5 more" vs "Next 14d") so users understand the different models.                        |

---

## Summary

**Total new files:** 2 (`theme-toggle.tsx`, `first-sync-banner.tsx`)
**Total modified files:** ~14
**New unit tests:** ~10
**No new dependencies.** All changes use existing dnd-kit, Tailwind, and shadcn/ui primitives.
**No database migrations.** First-sync detection is client-side via localStorage.
