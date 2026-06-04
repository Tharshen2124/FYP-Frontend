# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # Run ESLint
npm run typecheck    # Type-check without emitting (tsc --noEmit)
npm run format       # Format with Prettier (ts, tsx files)
```

There are no tests configured in this project.

## Architecture

**HabitFlow** is a weekly planner app based on Stephen Covey's 7 Habits of Highly Effective People framework. The planned user flow is: Landing → Login → Roles/Goals → Tasks → Weekly Schedule → Google Calendar export.

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

### User flow (implemented so far)
Landing → Login → `/roles` → `/sharpen-the-saw` → `/fixed-appointments` → `/schedule-tasks` → `/dashboard`

### Current pages
- `/` — Landing page (`app/page.tsx`), all content inline; a `components/landing/` directory exists with extracted section components (header, hero, features, etc.) but is not yet wired up
- `/login` — Login/signup page with animated background
- `/roles` — Role & goal management; Next enabled when ≥1 role and ≥1 goal exist; links to `/sharpen-the-saw`
- `/sharpen-the-saw` — Four dimension cards (Physical, Spiritual, Mental, Social/Emotional), each with add/inline-edit/delete activities; Next enabled when every dimension has ≥1 activity; links to `/fixed-appointments`
- `/fixed-appointments` — Google Calendar-style weekly view (Mon–Sun, 6 AM–10 PM); click slot to add, hover card to edit/delete, drag-and-drop to reschedule; clash detection (warn on 1 overlap, block on 2+); Next enabled when ≥1 appointment exists
- `/schedule-tasks` — Same Google Calendar–style weekly view as Fixed Appointments. Fixed appointments from the previous step appear in blue (`#3b82f6`) with a lock icon and are non-interactive. Tasks are added via a modal that requires linking to either a Role Goal (select role → select goal) or a Sharpen the Saw activity (select dimension → select activity); the task's color inherits from the linked role/dimension. An optional "Daily Priority" toggle (star icon) marks the task as a daily priority and shows a filled star badge on the calendar card. Clash detection works across fixed appointments AND tasks combined. `canProceed = tasks.length > 0`.
- `/dashboard` — Post-onboarding home screen. Uses a **sidebar layout** (not `AppNav`): fixed left sidebar (`w-64`, `bg-card`) with HabitFlow logo, 7 nav links (Roles and Goals, Sharpen the Saw, Schedule Upcoming Weekly Plan, Google Calendar Settings, Evening Reflections, History, Analytics) with active-state highlight, and a Sign Out button. Main area shows "Schedule for this Week" heading, "Edit Weekly Plan" button (links to `/schedule-tasks`), a legend (fixed/priority/now), and a read-only weekly timetable. Timetable highlights today's column (`bg-primary/5`), circles today's date in primary, and shows a "now" indicator line. Events are non-interactive; uses the same `HR_PX=64`, `CAL_START=6`, `CAL_END=22` constants as other calendar pages. Mock data in `_constants/mock-data.ts` combines fixed appointments (blue, lock icon) and tasks (role/dimension colors, star badge for daily priority).
- `/evening-reflections` — Sidebar lists 8 weeks (current week first); main area shows a Weekly Summary card (AI-simulated, 1.8 s delay) and a 7-day card grid; Edit/Create button opens a Dialog with a Textarea; weeks with any entry show a purple dot indicator; not part of the onboarding flow (Back button)
- `/google-calendar` — Two states: disconnected (connect card) and connected (settings cards). Connected state: connection status + Disconnect, Allow Sync Changes toggle, Export Categories tree (Fixed Appointments leaf, Sharpen the Saw with 4 sub-dimensions, Role Tasks with 4 mock roles); parent checkboxes support indeterminate state; sticky Discard/Save footer appears only when settings are dirty; not part of the onboarding flow (Back button)

### Layout conventions
- Onboarding pages use `max-w-7xl mx-auto` for main content, matching the `<AppNav>` width.
- Background decoration: two fixed blurred blobs (`bg-primary/10` top-left, `bg-secondary/20` bottom-right).
- Onboarding page structure: `<AppNav>` → `<main className="relative z-10 px-6 py-8">` → `<div className="max-w-7xl mx-auto">`.
- Dashboard and post-onboarding pages use a **sidebar layout**: `<div className="flex h-screen overflow-hidden bg-background">` → `<Sidebar />` → `<main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">`. No `AppNav` or `max-w` wrapper.

### File structure convention
Pages with non-trivial logic are split into private subfolders (prefixed with `_` to signal they are internal to that route and must not be imported from outside it):

```
app/<route>/
  page.tsx          ← slim orchestrator: state + event handlers only
  _types/
    index.ts        ← all TypeScript interfaces and types
  _constants/
    calendar.ts     ← calendar dimensions, day labels, EMPTY_MODAL, color constants
    mock-data.ts    ← placeholder data (roles, goals, dimensions, fixed appointments)
  _utils/
    time.ts         ← pure time helpers (minsToStr, strToMins, fmtTime, snapMins)
    calendar.ts     ← overlap detection and position style calculation
    tasks.ts        ← domain-specific helpers (e.g. getLinkMeta)
  _components/
    *.tsx           ← UI pieces consumed only by this route's page
```

`/schedule-tasks` is the reference implementation of this pattern. Apply the same structure to future complex pages. Simpler pages (roles, sharpen-the-saw) can stay as a single `page.tsx` until they grow large enough to warrant splitting.

### State management
All state is currently local React `useState` — no global store, no backend, no auth integration yet. The login page has a UI-only Google OAuth button that is not connected.

### Components
- `components/ui/` — shadcn-generated primitives (Button, Input, Dialog, AlertDialog, etc.)
- `components/app-nav.tsx` — Shared navigation bar used on all app pages. Props: `action` ("back"|"next"), `nextHref`, `nextEnabled`, `onNext`, `backHref`, `extra`. When `nextEnabled && nextHref`, renders a `<Link>` (no JS navigation); otherwise renders a disabled or `onNext`-callback button.
- `components/clash-warning-modal.tsx` — Warning dialog for 1 overlapping appointment. Props: `open`, `conflictingTitle`, `onProceed`, `onCancel`.
- `components/clash-block-modal.tsx` — Hard-block dialog when 2+ overlapping appointments. Props: `open`, `onClose`.
- `components/animated-schedule.tsx` — Hero section animation showing a draggable schedule demo
- `components/theme-provider.tsx` — `next-themes` wrapper
- `components/landing/` — Decomposed landing page sections (not yet used in `app/page.tsx`)

### Fixed Appointments — key implementation details
- Constants: `CAL_START=6`, `CAL_END=22`, `HR_PX=64` (px/hour), `TOTAL_HRS=16`.
- Drag uses invisible ghost image trick so the native drag preview is hidden; position is calculated from `colRefs`.
- `dragInfo` is a `useRef` (not state) to avoid stale closure bugs in the `onDrop` handler.
- `PendingAction` union type discriminated by `type: "drop" | "save"` — shared between drag-drop and edit-save clash flows.
- `getOverlaps(all, dayIndex, startMins, endMins, excludeId)` — returns overlapping appointments.
- `getApptPositionStyle(appt, allAppts)` — returns `left/right/width` inline styles; when 2 events overlap they split 50/50 sorted by `(startMins, id)` for stable column assignment.
- `canProceed = appts.length > 0` — Next button gate.
- Next button on this page: `nextHref="/schedule-tasks"`.

### Schedule Tasks — key implementation details
- Extends Fixed Appointments with a combined `allCalItems` array (fixed + tasks) so overlap detection covers both types.
- Fixed appointments are hardcoded mock data (`MOCK_FIXED`) — read-only, rendered with a lock icon, not draggable.
- Roles/goals and sharpen-the-saw dimensions/activities are also mock data (`MOCK_ROLES`, `MOCK_DIMENSIONS`) — in production these would come from a shared store.
- Task color is derived from the linked role color or dimension color at save time.
- Modal `getLinkMeta()` validates that a goal or activity is selected; Save button is disabled until valid.
- `isDailyPriority` flag shows a filled `Star` badge on the calendar card and a styled toggle in the modal.
- `canProceed = tasks.length > 0` — Next button gate (destination TBD).

### Dashboard — key implementation details
- Uses a sidebar layout (see Layout conventions above); `<Sidebar>` component lives in `app/dashboard/_components/sidebar.tsx`.
- `<Sidebar>` uses `usePathname()` to highlight the active nav item with `bg-primary/20 text-primary`.
- Timetable is **read-only** — no click-to-add, no drag, no modals. `EventCard` renders fixed appointments with a `<Lock>` icon and tasks with an optional filled `<Star>` for daily priority.
- `getWeekStart(date)` computes the Monday of the current week; day dates are derived from it and rendered as date numbers in the column headers.
- "Now" indicator (purple dot + horizontal rule) is drawn on the current day's column if the current time falls within `CAL_START–CAL_END`.
- `MOCK_EVENTS` in `_constants/mock-data.ts` combines both fixed appointments and tasks; each event carries a `color` and optional `isFixed` / `isDailyPriority` flag.
