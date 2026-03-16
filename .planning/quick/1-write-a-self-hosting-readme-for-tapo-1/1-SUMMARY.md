---
phase: 11-self-hosting-readme
plan: "01"
subsystem: docs
tags: [readme, self-hosting, documentation, landing-page]
dependency_graph:
  requires: [phase-8-sentry, phase-9-ics-export, phase-10-landing-page]
  provides: [self-hosting-guide, real-github-url]
  affects: [README.md, src/app/page.tsx]
tech_stack:
  added: []
  patterns: [env-vars-table, step-by-step-setup-guide]
key_files:
  created:
    - README.md
  modified:
    - src/app/page.tsx
    - .planning/STATE.md
    - .planning/ROADMAP.md
decisions:
  - "GITHUB_README_URL set to https://github.com/j-dio/task-aggregator#readme — real GitHub repo URL replacing placeholder"
metrics:
  duration: "~5 min"
  completed: "2026-03-16"
  tasks_completed: 2
  files_modified: 4
---

# Phase 11 Plan 01: Self-Hosting README Summary

Complete self-hosting guide for TapO(1) with all env vars, Supabase/Google Cloud/VAPID setup steps, and real GitHub URL wired into the landing page.

## What Was Built

**README.md** — Full self-hosting guide replacing the default Next.js boilerplate, covering:
- Tech stack table with exact versions from package.json (README-05)
- Environment variables table: all 9 variables with descriptions and sources (README-01)
- Supabase setup: project creation, CLI login, `supabase db push`, `uvec-proxy` Edge Function deploy, Google OAuth config in Supabase Auth (README-02)
- Google Cloud Console setup: Classroom API enable, OAuth consent screen with required scopes, OAuth credentials with all three redirect URIs (README-03)
- VAPID key generation with explicit `mailto:` prefix requirement and runtime failure explanation (README-04)
- Running locally, running tests, Vercel deployment, and contributing sections

**src/app/page.tsx** — `GITHUB_README_URL` placeholder replaced with `https://github.com/j-dio/task-aggregator#readme`. The Self-hosting guide button on the landing page now links to the real README.

**STATE.md + ROADMAP.md** — Phase 11 marked complete, v1.1 milestone marked complete, progress updated to 100%.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write README.md — full self-hosting guide | cd3d579 | README.md |
| 2 | Replace GITHUB_README_URL and update STATE/ROADMAP | 90b2a0e | src/app/page.tsx, .planning/STATE.md, .planning/ROADMAP.md |

## Decisions Made

- GITHUB_README_URL set to `https://github.com/j-dio/task-aggregator#readme` — this is the real GitHub repo URL; the Phase 10 plan had recorded it as a placeholder to be filled in Phase 11

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- README.md exists: confirmed (`test -f README.md`)
- NEXT_PUBLIC_ env vars in README: 6 occurrences (requirement: 3+)
- Real URL in page.tsx: `grep "j-dio/task-aggregator#readme" src/app/page.tsx` returns the constant line
- Commits exist: cd3d579 (docs), 90b2a0e (feat)
