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
The app uses a fixed dark color palette defined as CSS variables in `app/globals.css`. The theme does not change between light/dark — both modes use the same values:
- Background: `#090040` (deep navy)
- Card: `#130066`
- Primary: `#B13BFF` (magenta)
- Secondary: `#471396` (purple)
- Accent: `#FFCC00` (yellow)
- Muted: `#1a0080`

All new UI should use these semantic CSS variables (`bg-background`, `text-foreground`, `bg-card`, etc.) rather than raw hex values. Inline `style={{ color: ... }}` is only used for dynamic per-role colors.

### Typography
Two Google Fonts are loaded in `app/layout.tsx` as CSS variables:
- `--font-bricolage` (Bricolage Grotesque) — default `font-sans`, used for headings/bold text
- `--font-ubuntu` — used for body/serif text (apply with `font-serif` Tailwind class)

### Current pages
- `/` — Landing page (`app/page.tsx`), all content inline; a `components/landing/` directory exists with extracted section components (header, hero, features, etc.) but is not yet wired up
- `/login` — Login/signup page with animated background
- `/roles` — Role & goal management (client component, local state only — no persistence yet)
- `/sharpen-the-saw` — Empty page (placeholder)

### State management
All state is currently local React `useState` — no global store, no backend, no auth integration yet. The login page has a UI-only Google OAuth button that is not connected.

### Components
- `components/ui/` — shadcn-generated primitives (Button, Input, Dialog, AlertDialog, etc.)
- `components/animated-schedule.tsx` — Hero section animation showing a draggable schedule demo
- `components/theme-provider.tsx` — `next-themes` wrapper
- `components/landing/` — Decomposed landing page sections (not yet used in `app/page.tsx`)
