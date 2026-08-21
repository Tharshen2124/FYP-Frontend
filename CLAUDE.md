# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Start dev server with Turbopack
npm run build          # Production build
npm run lint           # Run ESLint
npm run typecheck      # Type-check without emitting (tsc --noEmit)
npm run format         # Format with Prettier (ts, tsx files)

npm run test           # Unit tests (Vitest, jsdom)
npm run test:watch     # Unit tests in watch mode
npm run test:coverage  # Unit tests with v8 coverage
npm run test:e2e       # End-to-end tests (Playwright, boots the dev server itself)
npm run test:e2e:ui    # Playwright UI mode
```

Unit tests live in `tests/unit/`, e2e specs in `tests/e2e/`. Vitest only picks up
`tests/unit/**/*.{test,spec}.{ts,tsx}`, so a Playwright spec can never be run by Vitest.

## Architecture

**HabitFlow** is a weekly planner app based on Stephen Covey's 7 Habits of Highly Effective People framework.

### Stack
- Next.js 16 (App Router) with React 19 and TypeScript
- Tailwind CSS v4 (configured via `@import 'tailwindcss'` in `globals.css`, no `tailwind.config` file)
- shadcn/ui components (in `components/ui/`) with Radix UI primitives
- Framer Motion for animations throughout
- `next-themes` for theme support

### Path alias
`@/*` maps to the repo root (e.g. `@/components/ui/button`).

### Design system
Reference DESIGN_GUIDELINES.md file for more information.

### Typography
Two Google Fonts are loaded in `app/layout.tsx` as CSS variables:
- `--font-bricolage` (Bricolage Grotesque) — default `font-sans`, used for headings/bold text
- `--font-ubuntu` — used for body/serif text (apply with `font-serif` Tailwind class)

## Flows

There are three distinct groups of routes.

**1. Marketing** — `/` (landing) → `/login`. Every landing CTA links to `/login`; submitting
either login form sends the user to `/onboarding/roles` (there is no auth backend yet).

**2. Onboarding** (`/onboarding/*`) — the five-step first-run flow, walked once. `app/onboarding/
layout.tsx` gates the whole flow on auth and closes it afterwards: an onboarded user who types a
step URL is sent to `/dashboard` with a toast saying why. The guard reads whether they were
onboarded when they *arrived*, not the live flag, because step 5 calls `markOnboarded()` just
before navigating — reading the live flag would fire on the person who has this second finished.
It redirects rather than going back, since every step sits behind the same guard and backing out of
one would land on another. Each step is gated by an
`<AppNav action="next">` button and tracked by `<OnboardingStepper>`:

| Step | Route | Next unlocks when |
| --- | --- | --- |
| 1 | `/onboarding/roles` | ≥1 role and ≥1 goal exist |
| 2 | `/onboarding/sharpen-the-saw` | every dimension has ≥1 activity |
| 3 | `/onboarding/fixed-appointments` | ≥1 appointment exists |
| 4 | `/onboarding/schedule-tasks` | ≥1 task exists |
| 5 | `/onboarding/complete` | always (links to `/dashboard`) |

**3. App** — everything reachable from the dashboard `<Sidebar>`:
`/dashboard`, `/roles`, `/sharpen-the-saw`, `/weekly-plan/goals`, `/settings`,
`/evening-reflections`, `/history`, `/analytics`.

The weekly-plan sub-flow (`/weekly-plan/*`) is the repeatable version of onboarding steps 1–4:
`/weekly-plan/goals` → `/weekly-plan/sharpen-the-saw` → `/weekly-plan/schedule` → `/dashboard`.
Unlike onboarding it *selects* from existing roles/goals and activities rather than creating them,
and it merges fixed appointments and tasks into one tabbed calendar page.

**Which week it plans** is the thing that distinguishes it from onboarding, which only ever plans
the week the user signed up in. The target lives in the URL as `?week_start=YYYY-MM-DD`, so a
refresh, a Back, or a shared link all land on the same week and the three steps inherit it without
a store. With no param, `app/weekly-plan/_utils/use-target-week.ts` resolves one: **the current week
if it has no plan, otherwise next week**, then `router.replace`s it in. That second case is why the
flow takes a week at all — always planning next week would leave someone returning after a gap
unable to fill in the week they are standing in.

Choosing the week is **one decision at step 1**, so `WeekTargetBanner` and its toggle live on
`/weekly-plan/goals` only. Steps 2 and 3 inherit the week from the URL and never re-ask — on the
schedule step a mid-flow switch would swap the calendar out from under unsaved edits. That step says
which week it is on through the calendar's own date headers, which come from
`schedule/_utils/use-plan-week.ts`: the dates are those of the week being planned, and the "today"
pill and past-day dimming only appear when that week is the current one.

## Current pages

- `/` — Landing page. Sections live in `app/_components/`, copy/data in `app/_constants/landing.ts`.
- `/login` — Sign-in / sign-up card with an animated background. Tab switcher, password strength meter
  (sign-up only), UI-only Google OAuth button. Submitting navigates to `POST_AUTH_HREF`.
- `/onboarding/roles` — Role & goal management: add/edit roles (icon + colour), inline goal edit,
  weekly-priority star, warning dialog past `MAX_RECOMMENDED_GOALS` (10).
- `/onboarding/sharpen-the-saw` — Four dimension cards (Physical, Spiritual, Mental, Social/Emotional),
  each with add / inline-edit / delete activities.
- `/onboarding/fixed-appointments` — Google Calendar-style weekly view (Mon–Sun, 6 AM–10 PM); click a
  slot to add, hover a card to edit/delete, drag-and-drop to reschedule; clash detection
  (warn on 1 overlap, block on 2+).
- `/onboarding/schedule-tasks` — Same calendar. Fixed appointments render blue (`#3b82f6`) with a lock
  icon and are non-interactive. Tasks must link to either a role goal or a sharpen-the-saw activity and
  inherit that colour; an optional "Daily Priority" star shows a badge on the card. Clash detection
  spans fixed appointments *and* tasks.
- `/onboarding/complete` — Explains Evening Reflections and the End-of-Day check-in; links to `/dashboard`.
- `/dashboard` — Read-only weekly timetable with today's column highlighted, a "now" indicator line, and
  a legend. A completed task is struck through with a check, the same mark `/history` uses.
  "Edit Weekly Plan" is deliberately disabled — editing a week in place needs its own page
  that loads the current week and saves directly, and pointing it back at the planning flow's last
  step would mean "finish planning", not "save my change". Shows the end-of-day check-in modal once
  per day after the time saved in `localStorage["eod_time"]`.
- `/roles` — Standing role & goal management (sidebar layout), API-backed. Roles are long-lived;
  the goals shown are **this week's**. Deleting is archiving: a confirmation dialog states how many
  of this week's goals go, how many unfinished tasks come off the calendar, and how many completed
  tasks are kept. Archived roles list below with a Restore button, and removing a goal offers Undo.
- `/sharpen-the-saw` — Standing renewal-activity management (sidebar layout), with a delete confirmation.
- `/weekly-plan/goals` — API-backed. Carry forward the unfinished goals of the last week that was
  actually planned (each pick creates a fresh goal plus a `goal_carryovers` link) and stage
  brand-new ones. Everything commits on Next.
- `/weekly-plan/sharpen-the-saw` — API-backed. Pick which renewal activities to commit to the week;
  `PUT /weekly-plans/sharpen-the-saw` replaces the week's set on Next, and revisiting prefills it.
- `/weekly-plan/schedule` — API-backed. Tabbed calendar: "Fixed Appointments" and "Scheduled Tasks"
  share one `appts` state so clash detection spans both tabs. Saves both tabs on Next, sending
  `task_id` for anything the server already holds so an edit updates in place.
- `/settings` — End-of-Day check-in time (persisted to `localStorage`) and Google Calendar settings
  (connect/disconnect, sync toggle, export category tree with indeterminate parents, sticky
  Discard/Save bar shown only while dirty).
- `/evening-reflections` — API-backed. Week list sidebar (a `n/7` badge per week, a date jump, and
  "Load older weeks"), the AI weekly summary, and a 7-day reflection grid. Every day of the week you
  are standing in is writable in any order — filling in Monday on Thursday, or Sunday early, are both
  normal. Once a week has passed its entries can be viewed but not changed. The summary is generated
  **once per week and never regenerated**, and unlocks only when all 7 reflections are written; a
  past week can still be summarised, since read-only applies to the reflections, not to this.
- `/history` — API-backed. Past weeks only: the strip starts at *last* Monday, since the live week
  belongs to `/dashboard` and a goal in an unfinished week has no outcome yet. Week list sidebar
  (a tasks-done badge per week, a date jump, and "Load older weeks"), a stats row of ratios
  (goals achieved, tasks done, renewal activities, fixed appointments), role goals marked with how
  each resolved, renewal activities, and a schedule grid whose every chip names the role or
  dimension it served and whether it was done. It is the one surface that reads a week **as it was
  recorded**: goals under a since-archived role, goals since dropped and activities since deleted
  all still appear, flagged — which is why it has its own endpoints rather than composing `/roles`
  and `/sharpen-the-saw-activities`, both of which filter to `.active`.
- `/analytics` — 2×2 grid: sharpen-the-saw radar, role task table, daily priority bar chart, weekly
  completion trend. Date/range selectors filter against a fixed week registry.

## Layout conventions

- Onboarding and weekly-plan pages: `<AppNav>` → `<main className="relative z-10 px-6 py-8">` →
  `<div className="max-w-7xl mx-auto">`.
- Dashboard and post-onboarding pages use a **sidebar layout**:
  `<div className="flex h-screen overflow-hidden bg-background">` → `<Sidebar />` →
  `<main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">`. No `AppNav`, no `max-w` wrapper.
- Background decoration on every page: two fixed blurred blobs (`bg-primary/10` top-left,
  `bg-secondary/20` bottom-right).

## File structure convention

**This convention is applied to every route in `app/`. Keep it that way.**

`page.tsx` is a slim orchestrator — state plus event handlers — and everything else lives in
private subfolders. The `_` prefix marks them as internal to that route: Next.js excludes them from
routing, and **nothing outside the owning route may import from them**.

```
app/<route>/
  page.tsx          ← slim orchestrator: state + event handlers only
  _types/
    index.ts        ← all TypeScript interfaces and types for this route
  _constants/
    calendar.ts     ← calendar dimensions, day labels, EMPTY_MODAL, colour constants
    mock-data.ts    ← placeholder data (roles, goals, dimensions, fixed appointments)
  _utils/
    time.ts         ← pure time helpers (minsToStr, strToMins, fmtTime, snapMins)
    calendar.ts     ← overlap detection and position style calculation
    tasks.ts        ← domain-specific helpers (e.g. getLinkMeta)
  _components/
    *.tsx           ← UI pieces consumed only by this route's page
```

Rules:

1. **File names are kebab-case.** `fixed-appointment-card.tsx`, never `fixedAppointmentCard.tsx`.
2. **Imports inside a route are relative** (`../_utils/time`), not `@/app/...`. An `@/app/<route>/_*`
   import from another route is a convention violation — hoist the shared thing instead (rule 3).
3. **Flow-level private folders** hold what several routes in the same flow share. They sit at the
   shared segment and follow the same naming: `app/weekly-plan/_types/` (`PlanRole`, `PlanDimension`
   — the week being planned, not a standing library), `_utils/use-target-week.ts`,
   `_utils/dimensions.ts` and `_components/week-target-banner.tsx`, all three used by more than one
   step. The same private-import rule applies one level up: nothing outside `/weekly-plan` may
   import them.
4. **Genuinely app-wide UI lives in `components/`**, not in a route folder — `AppNav`, `Sidebar`,
   `OnboardingStepper`, the clash modals, and the shadcn primitives in `components/ui/`. Shared
   non-UI domain constants go in `lib/` — `lib/sharpen-the-saw-dimensions.ts` and
   `lib/role-colors.ts` (the role palette, needed by both `/roles` and `/weekly-plan/goals`).
5. **Derived/filtered data belongs in `_utils`, raw data in `_constants`.** `/analytics` is the model:
   `_constants/mock-data.ts` holds the week registry and raw numbers, `_utils/analytics.ts` holds
   `getSharpenData`, `getRoleStats`, `getDailyPriority`.
6. Routes that are genuinely trivial (`/onboarding/complete` is pure markup) may stay a single
   `page.tsx` — but add the folders as soon as they grow logic, types, or repeated markup.

`/weekly-plan/schedule` and `/analytics` are the reference implementations.

## State management

There is no global data store: state is local `useState` per route, and routes that persist talk to
the Rails API through `lib/api.ts`. Auth is the one exception — a JWT in a cookie-backed zustand
store (`stores/auth-store.ts` + `lib/cookie-storage.ts`).

API-backed routes: `/login`, all four data-writing onboarding steps, `/dashboard`,
`/sharpen-the-saw`, `/roles`, `/evening-reflections`, `/history`, and all three `/weekly-plan/*`
steps. `/analytics` is the last one still seeded from its own `_constants/mock-data.ts`.

**"Has this week passed?" is a client decision**, like every other date in this app — the server
stores no timezone and keeps only a loose backstop that can never fire for a real user. It lives in
`lib/date.ts` (`isPastWeek`/`isFutureWeek`/`isEditableWeek`, alongside `weekStartsBack`, which
generates a week strip), which compares `YYYY-MM-DD` Mondays as strings. These four were hoisted out
of `app/evening-reflections/_utils/weeks.ts` when `/history` grew a strip of its own: a route may
not import another route's private folder, and a second copy of "has this week passed" is exactly
what `lib/date.ts` exists to prevent.

**A task is ticked off in the End-of-Day check-in**, which is the only thing that writes
`tasks.is_completed` (`PATCH /tasks/:id/completion`). The modal seeds itself from what is already
stored and sends only what changed, so saving twice does not untick the first save.

Routes with API state follow `/sharpen-the-saw` and `/roles`: a `let cancelled = false` effect for
the initial load, an `isLoading` guard, and each write sent before local state is patched from the
response, with `toast.error("Couldn't … — please try again.")` on failure. `/roles` keeps that
lifecycle in `_utils/use-roles.ts` so `page.tsx` stays under the 250-line cap.

Beyond auth, the only `localStorage` is the end-of-day check-in (`eod_time`, `eod_shown_date`),
written by `/settings` and read by `/dashboard`.

**Goals are week-scoped.** Roles persist week to week; goals belong to exactly one weekly plan, so
every roles/goals request carries a `week_start`. Nothing is hard-deleted — see the root
`CLAUDE.md` and `ERD_businnes_rules.md`.

## Shared components

- `components/ui/` — shadcn-generated primitives (Button, Input, Dialog, AlertDialog, Tabs, …)
- `components/app-nav.tsx` — Top nav for onboarding/weekly-plan pages. Props: `action` ("back"|"next"),
  `nextHref`, `nextEnabled`, `onNext`, `backHref`, `extra`. When `nextEnabled && nextHref` it renders a
  `<Link>`; otherwise a disabled or `onNext`-callback button.
- `components/sidebar.tsx` — Fixed left nav for dashboard-area pages; highlights the active route via
  `usePathname()`.
- `components/onboarding-stepper.tsx` — 5-step progress indicator. Props: `currentStep` (1–5).
- `components/clash-warning-modal.tsx` — Warning dialog for exactly 1 overlapping appointment.
  Props: `open`, `conflictingTitle`, `onProceed`, `onCancel`.
- `components/clash-block-modal.tsx` — Hard-block dialog for 2+ overlaps. Props: `open`, `onClose`.
- `components/animated-schedule.tsx` — Hero animation showing a draggable schedule demo.
- `components/theme-provider.tsx` — `next-themes` wrapper.

Landing-page sections are **not** here — they are route-private in `app/_components/`, since only `/`
uses them. (A superseded v1 landing design used to live in `components/landing/`; it was deleted once
v2 replaced it. Recover from git at `1937e12` if ever needed.)

## Calendar implementation notes

The three calendar routes (`/onboarding/fixed-appointments`, `/onboarding/schedule-tasks`,
`/weekly-plan/schedule`) plus the read-only `/dashboard` timetable share the same geometry constants,
each in their own `_constants/calendar.ts`: `CAL_START=6`, `CAL_END=22`, `HR_PX=64`,
`TOTAL_HRS = CAL_END - CAL_START`.

- Drag uses an invisible ghost image so the native drag preview is hidden; the drop position is
  computed from `colRefs`.
- `dragInfo` is a `useRef` (not state) to avoid stale-closure bugs in the `onDrop` handler.
- `PendingAction` is a union discriminated by `type: "drop" | "save"`, shared between the drag-drop and
  edit-save clash flows.
- `getOverlaps(all, dayIndex, startMins, endMins, excludeId)` returns overlapping items.
- `getPositionStyle(item, allItems)` returns `left/right/width` inline styles; two overlapping events
  split the column 50/50, sorted by `(startMins, id)` for stable column assignment.
