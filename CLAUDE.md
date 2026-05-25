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
Landing → Login → `/roles` → `/sharpen-the-saw` → `/fixed-appointments` → *(next TBD)*

### Current pages
- `/` — Landing page (`app/page.tsx`), all content inline; a `components/landing/` directory exists with extracted section components (header, hero, features, etc.) but is not yet wired up
- `/login` — Login/signup page with animated background
- `/roles` — Role & goal management; Next enabled when ≥1 role and ≥1 goal exist; links to `/sharpen-the-saw`
- `/sharpen-the-saw` — Four dimension cards (Physical, Spiritual, Mental, Social/Emotional), each with add/inline-edit/delete activities; Next enabled when every dimension has ≥1 activity; links to `/fixed-appointments`
- `/fixed-appointments` — Google Calendar-style weekly view (Mon–Sun, 6 AM–10 PM); click slot to add, hover card to edit/delete, drag-and-drop to reschedule; clash detection (warn on 1 overlap, block on 2+); Next enabled when ≥1 appointment exists
- `/evening-reflections` — Sidebar lists 8 weeks (current week first); main area shows a Weekly Summary card (AI-simulated, 1.8 s delay) and a 7-day card grid; Edit/Create button opens a Dialog with a Textarea; weeks with any entry show a purple dot indicator; not part of the onboarding flow (Back button)
- `/google-calendar` — Two states: disconnected (connect card) and connected (settings cards). Connected state: connection status + Disconnect, Allow Sync Changes toggle, Export Categories tree (Fixed Appointments leaf, Sharpen the Saw with 4 sub-dimensions, Role Tasks with 4 mock roles); parent checkboxes support indeterminate state; sticky Discard/Save footer appears only when settings are dirty; not part of the onboarding flow (Back button)

### Layout conventions
- All pages use `max-w-7xl mx-auto` for main content, matching the nav bar width.
- Background decoration: two fixed blurred blobs (`bg-primary/10` top-left, `bg-secondary/20` bottom-right).
- Page structure: `<AppNav>` → `<main className="relative z-10 px-6 py-8">` → `<div className="max-w-7xl mx-auto">`.

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
- Next button on this page: `onNext={() => {}}` (destination TBD).
