# Phase 9: ICS Export - Research

**Researched:** 2026-03-16
**Domain:** Client-side ICS generation, Web Share API, iOS PWA file export
**Confidence:** HIGH (core stack), MEDIUM (iOS PWA file sharing behavior)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Export button lives in the dashboard **header toolbar** alongside ViewToggle, + Custom Task, and SyncButton
- Icon-only button (`variant="ghost" size="icon-sm"`) matching SyncButton/ThemeToggle style
- Use a Lucide calendar-download icon (CalendarDown or CalendarArrowDown)
- Appears on **all dashboard views** (action board, calendar, history) — not view-specific
- Also included in the **mobile header** (required by ICS-04 Safari PWA support)
- Tasks exported as **all-day events** (`DTSTART` as DATE type, no time component) on the due date
- Tasks with `dueDate === null` are **excluded** from the export silently
- Overdue tasks (pending with past due date) **are included** — still actionable
- `SUMMARY` = task title — no status prefix
- `DESCRIPTION` = `Course: {courseName} ({source})\nOpen: {task.url}` (omit URL line if null)
- `UID` = source-prefixed: `uvec-{id}@tapo1.app`, `gclassroom-{id}@tapo1.app`, `custom-{id}@tapo1.app`
- Always exports **all pending and in-progress** tasks — active dashboard filters are ignored
- **Client-side only** via `ics` npm library — no server round-trip
- Safari PWA detection: `(navigator as Navigator & { standalone?: boolean }).standalone === true`
- On Safari PWA standalone: use **Web Share API** (`navigator.share({ files: [blob] })`)
- On all other contexts: standard blob download (`URL.createObjectURL` + `<a>` click)
- Filename: `tapo1-tasks-YYYY-MM-DD.ics`
- **Success toast**: `"Exported {N} tasks to calendar"`
- **Empty state toast**: `"No tasks to export"` — no file downloaded
- **Error toast**: `"Export failed. Try again."` — no file downloaded
- No loading state needed

### Claude's Discretion
- Which specific Lucide icon to use (CalendarDown vs CalendarArrowDown vs Calendar with download indicator)
- Exact Sonner toast variant (default, success, error)
- Whether to extract ICS generation into `src/lib/ics-export.ts` as a pure function for testability

### Deferred Ideas (OUT OF SCOPE)
- Per-task export from task card — ICS-06 (v2 requirement)
- Filter-scoped export (e.g. "export only UVEC tasks") — ICS-07 (v2 requirement)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ICS-01 | User can download all pending and in-progress tasks as a `.ics` file from the dashboard | `ics` npm `createEvents` API; blob download pattern |
| ICS-02 | Exported `.ics` file is RFC 5545 compliant with UTC timestamps (no floating times) | All-day event `start: [year, month, day]` array format emits `DTSTART;VALUE=DATE` (DATE type), which is unambiguous per RFC 5545 §3.3.4 — no floating time issue for date-only events |
| ICS-03 | Each exported task event has a globally unique UID prefixed by source | `uid` field in `EventAttributes`; format `{source}-{id}@tapo1.app` |
| ICS-04 | Export works in Safari PWA standalone mode (falls back to Web Share API) | `navigator.standalone` detection; `navigator.share({ files })` with `navigator.canShare()` guard |
| ICS-05 | User sees "No tasks to export" notification when all tasks are done or dismissed | Filter tasks before ICS generation; show Sonner toast and abort if empty |
</phase_requirements>

---

## Summary

Phase 9 adds a client-side ICS export feature. The `ics` npm package (by adamgibbons) generates RFC 5545-compliant `.ics` files from a `TaskWithCourse[]` array. It is not yet installed in the project — it must be added to dependencies. Generation is synchronous (`createEvents` returns `{ error, value }` without a callback), making the export feel instant with no loading state required.

The standard blob download pattern (`URL.createObjectURL` + `<a download>` click) works in all browsers except Safari in PWA standalone mode, where it silently fails. The Web Share API (`navigator.share({ files: [File] })`) is the correct fallback: it triggers the iOS Share Sheet and lets users save the file or open it in other apps. Detection is via `window.navigator.standalone` (iOS-specific property). Use `navigator.canShare()` before calling `navigator.share()` to guard against edge cases.

**Critical iOS 18 caveat discovered:** Apple made ICS direct-import-to-Calendar harder in iOS 18 — the Calendar app no longer shows an "Add to Calendar" option directly from the share sheet in all flows. However, the Web Share API itself still works for delivering the file to Files app, Mail, or other apps. The ICS export feature will still function correctly — iOS users can save the file to Files and drag-drop into Calendar, or open it from another app. This is a UX limitation in iOS 18, not a technical blocker. Document it as a known limitation.

**Primary recommendation:** Install `ics` npm library; extract `generateIcsContent(tasks: TaskWithCourse[])` as a pure function in `src/lib/ics-export.ts`; add `ExportButton` component following the `SyncButton` pattern.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ics` | `^3.8.1` (latest at time of STATE.md note) | Generates RFC 5545-compliant `.ics` strings from JS event objects | Widely used, actively maintained, ships TypeScript types, handles all iCal edge cases |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | `^0.575.0` | `CalendarArrowDown` icon for export button | Already installed — use `CalendarArrowDown` (confirmed available) |
| `sonner` | `^2.0.7` | Toast feedback for success / empty / error states | Already configured globally |
| `useTasks` hook | — | Returns `TaskWithCourse[]` with full task + course data | Call with `{}` (no filters) to get all tasks |

### Not Needed
- No server-side component or API route — export is fully client-side
- No additional date library — ICS `start` takes a `[year, month, day]` integer array

**Installation:**
```bash
npm install ics
```

---

## Architecture Patterns

### Recommended Project Structure

New files to create:
```
src/
├── lib/
│   └── ics-export.ts        # Pure function: generateIcsContent(tasks) → string
├── components/
│   └── export-button.tsx    # "use client" button component (like sync-button.tsx)
```

Files to modify:
```
src/
├── components/
│   └── sidebar-nav.tsx      # Add ExportButton in bottom user actions area
├── app/dashboard/
│   └── dashboard-shell.tsx  # Add ExportButton to mobile header
```

### Pattern 1: ICS Generation as Pure Function

**What:** Extract `generateIcsContent` into `src/lib/ics-export.ts` as a pure function with no side effects — takes tasks, returns ICS string or null.
**When to use:** Matches the `computeActionBoardBuckets` pattern. Pure functions are testable in Vitest node environment without DOM mocking.
**Example:**
```typescript
// src/lib/ics-export.ts
import { createEvents } from "ics";
import type { TaskWithCourse } from "@/types/task";

export interface IcsExportResult {
  content: string;
  count: number;
}

export function generateIcsContent(
  tasks: TaskWithCourse[],
): IcsExportResult | null {
  const exportable = tasks.filter(
    (t) =>
      (t.displayStatus === "pending" ||
        t.displayStatus === "overdue" ||
        t.status === "in_progress") &&
      t.dueDate !== null,
  );

  if (exportable.length === 0) return null;

  const events = exportable.map((task) => {
    const due = new Date(task.dueDate!);
    const year = due.getUTCFullYear();
    const month = due.getUTCMonth() + 1; // ics uses 1-based months
    const day = due.getUTCDate();
    const nextDay = new Date(due);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const sourceName =
      task.source === "uvec"
        ? "UVEC"
        : task.source === "gclassroom"
          ? "Google Classroom"
          : "Custom";
    const courseName = task.course?.name ?? "No course";

    let description = `Course: ${courseName} (${sourceName})`;
    if (task.url) description += `\nOpen: ${task.url}`;

    return {
      uid: `${task.source}-${task.id}@tapo1.app`,
      title: task.title,
      description,
      start: [year, month, day] as [number, number, number],
      end: [
        nextDay.getUTCFullYear(),
        nextDay.getUTCMonth() + 1,
        nextDay.getUTCDate(),
      ] as [number, number, number],
    };
  });

  const { error, value } = createEvents(events);
  if (error || !value) return null;

  return { content: value, count: exportable.length };
}
```

### Pattern 2: ExportButton Component (follows SyncButton pattern)

**What:** A `"use client"` component that calls `useTasks({})` directly to get unfiltered tasks, generates ICS, and handles the download or share flow.
**When to use:** Identical structure to `SyncButton` — self-contained, icon-only ghost button.
**Example:**
```typescript
// src/components/export-button.tsx
"use client";

import { CalendarArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { generateIcsContent } from "@/lib/ics-export";

export function ExportButton() {
  const { data: tasks = [] } = useTasks({});

  function handleExport() {
    const result = generateIcsContent(tasks);

    if (!result) {
      toast("No tasks to export");
      return;
    }

    try {
      const blob = new Blob([result.content], { type: "text/calendar" });
      const date = new Date().toISOString().slice(0, 10);
      const filename = `tapo1-tasks-${date}.ics`;

      const isSafariStandalone =
        (navigator as Navigator & { standalone?: boolean }).standalone === true;

      if (isSafariStandalone && navigator.share) {
        const file = new File([blob], filename, { type: "text/calendar" });
        if (navigator.canShare?.({ files: [file] })) {
          navigator.share({ files: [file], title: filename }).catch(() => {
            toast.error("Export failed. Try again.");
          });
        } else {
          toast.error("Export failed. Try again.");
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success(`Exported ${result.count} tasks to calendar`);
    } catch {
      toast.error("Export failed. Try again.");
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleExport}
      aria-label="Export to calendar"
      title="Export to calendar"
    >
      <CalendarArrowDown className="size-4" />
    </Button>
  );
}
```

### Pattern 3: SidebarNav Integration

Add `<ExportButton />` inside the `flex items-center gap-0.5` div alongside `<ThemeToggle />`, `<SyncButton />`, and sign-out button. The existing gap and button sizing ensure visual consistency.

### Anti-Patterns to Avoid

- **Sharing via `navigator.share` on non-standalone Safari:** The `navigator.share` API exists in regular mobile Safari too. Only use it as a fallback when `navigator.standalone === true`. On regular browsers the blob download works fine.
- **Calling `useTasks` with current dashboard filters:** The export must ignore UI filters — always call `useTasks({})`.
- **Using `DTSTART` with time for all-day events:** Passing a 3-element array `[year, month, day]` to `ics` correctly emits `DTSTART;VALUE=DATE:YYYYMMDD`, which is a DATE type (no floating time issue). Never pass a datetime here.
- **Forgetting `end` is the day after for all-day events:** RFC 5545 all-day events use exclusive end dates. Pass `[year, month, day+1]`.
- **Not revoking blob URL:** Always call `URL.revokeObjectURL(url)` after triggering the download to avoid memory leaks.
- **Calling `navigator.share` without `navigator.canShare` check:** Some iOS versions may not support file sharing via share API even in standalone mode.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RFC 5545 iCalendar string generation | Custom string concatenation | `ics` npm library | Line folding (75-char limit), special character escaping, CRLF line endings, PRODID, VCALENDAR headers, DTSTAMP — all handled automatically |
| UID generation | `Math.random()` or timestamp-based UID | Source-prefixed `{source}-{id}@tapo1.app` | IDs are already globally unique within Supabase; domain-scoping with `@tapo1.app` adds RFC 5545 conformance |

**Key insight:** iCalendar format has many subtle rules (line folding at 75 chars, CRLF endings, TEXT escaping of commas/semicolons/backslashes/newlines). The `ics` library handles all of this correctly.

---

## Common Pitfalls

### Pitfall 1: Month Indexing in `ics` DateArray

**What goes wrong:** `new Date().getMonth()` returns 0-based months (0=January). The `ics` library `start` array uses 1-based months (1=January). Passing `getMonth()` directly produces dates one month early.
**Why it happens:** JS Date API is 0-based; iCal format is 1-based. The `ics` library follows iCal convention.
**How to avoid:** Always use `getUTCMonth() + 1` when building the `start` array.
**Warning signs:** Exported events appear one month before the actual due date.

### Pitfall 2: `displayStatus` vs `status` for Export Filtering

**What goes wrong:** Filtering by `task.status === "pending"` misses overdue tasks. `displayStatus` is the correct derived field: `"overdue"` means `effectiveStatus === "pending" && dueDate < now`.
**Why it happens:** `displayStatus` is derived client-side in `use-tasks.ts` and not stored in DB. The task's raw `status` is still `"pending"` even when overdue.
**How to avoid:** Filter by `displayStatus === "pending" || displayStatus === "overdue" || status === "in_progress"`. Note: `displayStatus` may be undefined if tasks come from a context that doesn't compute it — handle both `status` and `displayStatus`.
**Warning signs:** Overdue tasks missing from export.

### Pitfall 3: iOS 18 ICS Import Limitation

**What goes wrong:** Users on iOS 18 find that tapping "Open in Calendar" from the share sheet doesn't directly import the event — Apple changed this behavior in iOS 18.
**Why it happens:** Apple's iOS 18 Calendar app removed the automatic "Add to Calendar" prompt from the share sheet for `.ics` files.
**How to avoid:** This is an Apple OS limitation, not a code bug. The Web Share API correctly delivers the file. Document the workaround: save to Files app, then drag into Calendar.
**Warning signs:** User reports "it didn't add to my calendar" — not a code error, direct them to save to Files first.

### Pitfall 4: Silent Failure When `navigator.share` Rejects

**What goes wrong:** The user dismisses the iOS Share Sheet (taps outside it). This causes `navigator.share()` to reject with `AbortError`. Showing an error toast in this case is wrong — the user deliberately cancelled.
**Why it happens:** `navigator.share()` returns a rejected Promise for both errors AND user cancellations.
**How to avoid:** Catch the rejection and only show error toast if `error.name !== "AbortError"`:
```typescript
navigator.share({ files: [file], title: filename }).catch((err: Error) => {
  if (err.name !== "AbortError") {
    toast.error("Export failed. Try again.");
  }
});
```
**Warning signs:** Error toast appearing when user cancels the share sheet.

### Pitfall 5: `useTasks({})` Returns Tasks Within Default Date Window

**What goes wrong:** `useTasks` with empty filters applies a default date window (30 days back, 60 days ahead). Tasks with due dates outside this window are not returned.
**Why it happens:** `fetchTasks` in `use-tasks.ts` applies `overdueFloor` and `laterCeiling` to the Supabase query. Tasks far in the future won't appear.
**How to avoid:** The export scope is "all pending and in-progress tasks" — but tasks beyond the 60-day window are by definition not visible to the user either. This is acceptable behavior. If needed, pass wider window params like `{ overdueWindowDays: 365, laterWindowDays: 365 }`. Given the CONTEXT.md decisions don't mention extending the window, use `useTasks({})` as specified and accept the default window.
**Warning signs:** User complains that a task due in 90 days isn't in the export — acceptable behavior.

---

## Code Examples

### `ics` createEvents — All-Day Event with UID and Description

```typescript
// Source: github.com/adamgibbons/ics README
import { createEvents } from "ics";

const { error, value } = createEvents([
  {
    uid: "uvec-abc123@tapo1.app",
    title: "Assignment: Research Paper",
    description: "Course: ENGL 101 (UVEC)\nOpen: https://uvec.example.com/task/1",
    start: [2026, 4, 15],       // April 15, 2026 — 1-based month
    end: [2026, 4, 16],         // Day after (exclusive end for all-day)
  },
]);

// value is an RFC 5545-compliant string:
// BEGIN:VCALENDAR
// ...
// BEGIN:VEVENT
// UID:uvec-abc123@tapo1.app
// DTSTART;VALUE=DATE:20260415
// DTEND;VALUE=DATE:20260416
// SUMMARY:Assignment: Research Paper
// DESCRIPTION:Course: ENGL 101 (UVEC)\nOpen: https://uvec.example.com/task/1
// ...
// END:VEVENT
// END:VCALENDAR
```

### Blob Download (non-Safari-standalone)

```typescript
// Standard pattern — works in Chrome, Firefox, desktop Safari, mobile Safari non-standalone
const blob = new Blob([icsString], { type: "text/calendar" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "tapo1-tasks-2026-03-16.ics";
a.click();
URL.revokeObjectURL(url);
```

### Web Share API (iOS Safari PWA standalone)

```typescript
// Detect standalone and use Web Share API
const isSafariStandalone =
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

if (isSafariStandalone && navigator.share) {
  const file = new File([blob], filename, { type: "text/calendar" });
  if (navigator.canShare?.({ files: [file] })) {
    navigator.share({ files: [file], title: filename }).catch((err: Error) => {
      if (err.name !== "AbortError") {
        toast.error("Export failed. Try again.");
      }
    });
    toast.success(`Exported ${count} tasks to calendar`);
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Blob download for all browsers | Blob download + Web Share API fallback for iOS PWA standalone | iOS 12+ | Web Share API is the only reliable way to surface files in iOS PWA standalone mode |
| All-day events as floating DTSTART | All-day events as `DTSTART;VALUE=DATE` (3-element array in `ics`) | RFC 5545 clarification | Avoids timezone ambiguity; imports correctly in all major calendar apps |
| Manual iCal string building | `ics` npm library | 2017–present | Handles all RFC 5545 formatting rules automatically |

**Deprecated/outdated:**
- Floating DTSTART (no `VALUE=DATE` or UTC suffix): still technically valid but causes timezone confusion when imported across timezones — avoid.
- `ics` callback-style API: still works but synchronous `{ error, value }` return (no callback arg) is simpler and preferred.

---

## Open Questions

1. **iOS 18 ICS share sheet behavior — severity unclear**
   - What we know: iOS 18 changed how `.ics` files are handled from the share sheet; "Open in Calendar" may not appear or may not trigger direct import.
   - What's unclear: Whether this affects all `.ics` files or only invitations; whether iOS 18.x patches restored the behavior.
   - Recommendation: Proceed with Web Share API as specified in CONTEXT.md. The file is correctly delivered — the OS limitation is outside our control. If ICS-04 success criteria requires "events show in calendar," a real-device test on iOS 18 is needed before marking complete.

2. **`useTasks({})` cache key vs separate fetch**
   - What we know: `useTasks({})` is keyed as `["tasks", {}]`; adding this call in `ExportButton` will add one more TanStack Query subscriber for that key.
   - What's unclear: Whether this conflicts with existing queries using different filter objects.
   - Recommendation: This is standard TanStack Query behavior — multiple subscribers to the same key share one cache entry. No issue.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run src/lib/__tests__/ics-export.test.ts` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ICS-01 | `generateIcsContent` returns content for pending/in-progress tasks with dueDate | unit | `npx vitest run src/lib/__tests__/ics-export.test.ts` | Wave 0 |
| ICS-02 | Generated ICS string contains `DTSTART;VALUE=DATE:` (DATE type, no time) | unit | `npx vitest run src/lib/__tests__/ics-export.test.ts` | Wave 0 |
| ICS-03 | Each event UID matches `{source}-{id}@tapo1.app` pattern | unit | `npx vitest run src/lib/__tests__/ics-export.test.ts` | Wave 0 |
| ICS-04 | Safari PWA standalone export path — `navigator.share` called with File | manual-only | Real device test | N/A |
| ICS-05 | `generateIcsContent` returns null when no exportable tasks exist | unit | `npx vitest run src/lib/__tests__/ics-export.test.ts` | Wave 0 |

**ICS-04 is manual-only** — `navigator.standalone` and `navigator.share` are browser APIs that cannot be meaningfully unit-tested in a Vitest node environment without complex mocking that adds little value. Real device verification on an iPhone running Safari PWA is required.

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/__tests__/ics-export.test.ts`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/ics-export.test.ts` — covers ICS-01, ICS-02, ICS-03, ICS-05
- [ ] `ics` npm package installed: `npm install ics`

---

## Sources

### Primary (HIGH confidence)
- `github.com/adamgibbons/ics` README — `createEvents` API, `EventAttributes` interface, all-day event format (3-element DateArray)
- MDN `navigator.share` docs — Web Share Level 2 file support, `canShare()` usage
- Project codebase — `src/types/task.ts`, `src/hooks/use-tasks.ts`, `src/components/sidebar-nav.tsx`, `src/app/dashboard/dashboard-shell.tsx`, `src/components/sync-button.tsx`
- `lucide.dev/icons/?search=calendar-arrow` — `CalendarArrowDown` icon confirmed available

### Secondary (MEDIUM confidence)
- `discussions.apple.com/thread/255910569` — iOS 18 ICS share sheet behavior change (user reports, not official Apple docs)
- `developer.apple.com/forums/thread/119017` — iOS PWA file download recommendations (community answer, not official)
- `web.dev/articles/web-share` — Web Share API file sharing overview

### Tertiary (LOW confidence)
- Multiple WebSearch results re: iOS 18 ICS changes — consistent across sources, but no official Apple changelog

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `ics` library is well-documented with TypeScript types; project stack confirmed
- Architecture: HIGH — follows established `SyncButton`/`computeActionBoardBuckets` patterns directly from codebase
- ICS-04 (iOS PWA behavior): MEDIUM — Web Share API works; iOS 18 Calendar import limitation confirmed by community but not Apple docs
- Pitfalls: HIGH for month-indexing and AbortError; MEDIUM for iOS 18 limitation

**Research date:** 2026-03-16
**Valid until:** 2026-09-16 (stable spec; iOS behavior may shift with OS updates — recheck iOS 18.x notes before shipping)
