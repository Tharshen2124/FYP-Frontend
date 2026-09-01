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
| 5 | `/onboarding/complete` | always (links to `/dashboard`) — also carries the Premium offer |

**3. App** — everything reachable from the dashboard `<Sidebar>`:
`/dashboard`, `/roles`, `/sharpen-the-saw`, `/weekly-plan/goals`, `/settings`,
`/evening-reflections`, `/history`, `/analytics`, `/subscription`.

**4. Admin** — `/admin/dashboard`, alone. It is not in the sidebar and does not render one: an
admin account runs no week, so all nine of those links lead somewhere `proxy.ts` turns it straight
back from. See its entry under Current pages.

The weekly-plan sub-flow (`/weekly-plan/*`) is the repeatable version of onboarding steps 1–4:
`/weekly-plan/goals` → `/weekly-plan/sharpen-the-saw` → `/weekly-plan/schedule` → `/dashboard`.
Unlike onboarding it *selects* from existing roles/goals and activities rather than creating them,
and it merges fixed appointments and tasks into one tabbed calendar page.

**`/weekly-plan/edit` is not one of those steps.** It shares the segment, the layout gate and every
calendar component, but it is a single surface with its own Save bar reached from `/dashboard`, not
a wizard step — see its entry under Current pages.

**Which week it plans** is the thing that distinguishes it from onboarding, which only ever plans
the week the user signed up in. The target lives in the URL as `?week_start=YYYY-MM-DD`, so a
refresh, a Back, or a shared link all land on the same week and the three steps inherit it without
a store. With no param, `app/weekly-plan/_utils/use-target-week.ts` resolves one: **the current week
if it has no plan, otherwise next week**, then `router.replace`s it in. That second case is why the
flow takes a week at all — always planning next week would leave someone returning after a gap
unable to fill in the week they are standing in.

**The rule is the whole decision — there is no control to override it.** `WeekTargetBanner` on
`/weekly-plan/goals` reports which week was picked and why ("You haven't planned this week yet." /
"This week is already planned, so this is the week ahead."), and that is all it does. It used to
carry a toggle between the two weeks; that was removed, because re-planning a week already planned
is what the surfaces built for it are for — `/weekly-plan/edit` for appointments and tasks,
`/roles` for a goal, `/sharpen-the-saw` for an activity. A toggle here was a second, worse route to
those, and it made "which week am I editing?" a question the user had to keep answering.

**And it stops one week ahead.** With this week *and* the next both planned there is no third week
on offer: `useTargetWeek` resolves nothing, leaves the URL bare so a reload re-runs the check, and
sets `isFullyPlanned`. Step 1 then renders `AlreadyPlannedNotice` in place of the wizard — it names
both planned weeks, says the week after next becomes available once next week starts, and links to
the three surfaces above. Planning further out means planning a week whose shape is not known yet,
and an empty wizard over a finished week only invites staging goals into it. The notice is a page
rather than a toast-and-redirect because reaching it from the sidebar is an ordinary thing to do,
and a bounce with a fading message reads as a malfunction rather than an answer.

The banner lives on step 1 only. Steps 2 and 3 inherit the week from the URL and never re-ask — on
the schedule step a mid-flow switch would swap the calendar out from under unsaved edits. That step
says which week it is on through the calendar's own date headers, which come from
`app/weekly-plan/_utils/use-plan-week.ts`: the dates are those of the week being planned, and the "today"
pill, the past-day dimming and the block on those days only appear when that week is the current
one — planning the week ahead leaves all seven columns open.

## Current pages

- `/` — Landing page. Sections live in `app/_components/`, copy/data in `app/_constants/landing.ts`.
- `/login` — Sign-in / sign-up card with an animated background. Tab switcher and password strength
  meter (sign-up only); a successful sign-in goes to `DASHBOARD_HREF` or `ONBOARDING_HREF` depending
  on `is_onboarded`, and a successful sign-up drops the user on the Sign In tab rather than logging
  them in. **"Continue with Google" is on the Sign In tab only, and only signs in.** An account is
  opened one way — email, username and password — and Google links to it on first use, so an address
  with no account behind it comes back as `#error=no_account` and is told to sign up first
  (`OAUTH_ERROR_MESSAGES` in `_constants/auth.ts`).
- `/onboarding/roles` — Role & goal management: add/edit roles (icon + colour, the same palette and
  the same swatch picker `/roles` offers), inline goal edit, weekly-priority star, warning dialog
  past `MAX_RECOMMENDED_GOALS` (10). The colour is submitted as `color_id` with the role, so the
  choice made here is the one every calendar and every later page draws with.
- `/onboarding/sharpen-the-saw` — Four dimension cards (Physical, Spiritual, Mental, Social/Emotional),
  each with add / inline-edit / delete activities.
- `/onboarding/fixed-appointments` — Google Calendar-style weekly view (Mon–Sun, 6 AM–10 PM); click a
  slot to add, hover a card to edit/delete, drag-and-drop to reschedule; clash detection
  (warn on 1 overlap, block on 2+). Days already gone take nothing new — see the calendar notes.
  Appointments carry no colour of their own — they render blue (`FIXED_COLOR`, `#3b82f6`) with a
  lock icon, the same as everywhere else that shows them.
- `/onboarding/schedule-tasks` — Same calendar. Fixed appointments render blue (`#3b82f6`) with a lock
  icon and are non-interactive. Tasks must link to either a role goal or a sharpen-the-saw activity and
  inherit that colour; an optional "Daily Priority" star shows a badge on the card. Clash detection
  spans fixed appointments *and* tasks. The legend above it is the shared `<CalendarLegend>` — see
  **Task colour** below.
- `/onboarding/complete` — Explains Evening Reflections and the End-of-Day check-in; links to `/dashboard`.
  Also carries the Free/Premium comparison (`<PlanComparison>`, shared with `/subscription`).
  **Upgrade finishes onboarding before it leaves for Stripe, and the order is load-bearing**: checkout
  navigates off the app and returns to `/subscription`, outside the onboarding gate — so an account
  that left un-onboarded would never be marked, and its next sign-in would drop the user back at step 1.
  It is a button here rather than a sixth step for the same reason `layout.tsx` exists: a step placed
  after `markOnboarded()` would be bounced straight to `/dashboard` by that guard.
- `/dashboard` — Weekly timetable with today's column highlighted, a "now" indicator line, and
  a legend (the shared `<CalendarLegend>`, naming the week's own roles and dimensions — see
  **Task colour** below). A completed task is struck through with a check, the same mark
  `/history` uses.
  Every card is a button: clicking one opens a **detail dialog** carrying the full untruncated
  title, the day/time/duration and what the task serves (goal + role, or activity + dimension by
  its display name) — all of which the API already sends and the card has no room for. A fixed
  appointment serves nothing, so its dialog carries the header alone: the free-text notes it used
  to show were the only reader of `tasks.description`, and that column is gone.
  Its footer toggles the task done, which is the only way besides the once-a-day check-in to
  record one, and the only way at all to record a task on a day that is not today.
  Any day of the week is tickable: a task done early can be ticked early. The dialog is the whole
  of the page's write surface — nothing here renames, reschedules or deletes.
  "Edit Weekly Plan" leads to `/weekly-plan/edit`, not to the planning flow's last step: that route
  means "finish planning", not "save my change", and it closes off the days already gone — which is
  exactly the half of the week this button is usually pressed about.
  Shows the **End-of-Day check-in** once per day after `users.eod_time`,
  and only on a week that has a plan — the server refuses a reflection for a week that was never
  planned, so there would be nothing to tick and nothing it would accept. The check-in writes both
  halves of what it asks: today's completions through `PATCH /tasks/:id/completion`, and today's
  reflection through the same `PUT /weekly-plans/evening-reflections` `/evening-reflections` uses.
  Only the reflection gates Save — ticking nothing is a valid answer for a day where nothing got
  done — and the textarea is **seeded from the stored entry**, because that endpoint is an upsert
  keyed by (week, day) and opening blank would replace whatever was written earlier that afternoon.
  A failed *read* disables the write for the same reason.
  Both ways out write a **`check_ins` row** — `completed` on save, `skipped` on dismissal — which is
  what stops it asking again, on this device and every other one.
- `/roles` — Standing role & goal management (sidebar layout), API-backed. Roles are long-lived;
  the goals shown are **this week's**. Deleting is archiving: a confirmation dialog states how many
  of this week's goals go, how many unfinished tasks come off the calendar, and how many completed
  tasks are kept. Archived roles list below with a Restore button, and removing a goal offers Undo.
- `/sharpen-the-saw` — Standing Sharpen the Saw activity management (sidebar layout), with a
  delete confirmation.
- `/weekly-plan/goals` — API-backed. Carry forward the unfinished goals of the last week that was
  actually planned (each pick creates a fresh goal plus a `goal_carryovers` link) and stage
  brand-new ones. Everything commits on Next. Every row on a role's card is drawn in that role's
  colour, so the card reads as one thing and matches what the calendar will paint two steps later;
  a staged goal is the same colour but dashed, since what separates it from a committed one is
  whether it has been sent, not which role it belongs to. Roles are not *created* here, so there is
  no colour picker — that lives on `/roles` and `/onboarding/roles`.
- `/weekly-plan/sharpen-the-saw` — API-backed. Pick which Sharpen the Saw activities to commit to the week;
  `PUT /weekly-plans/sharpen-the-saw` replaces the week's set on Next, and revisiting prefills it.
- `/weekly-plan/schedule` — API-backed. Tabbed calendar: "Fixed Appointments" and "Scheduled Tasks"
  share one `appts` state so clash detection spans both tabs. Saves both tabs on Next, sending
  `task_id` for anything the server already holds so an edit updates in place.
- `/weekly-plan/edit` — API-backed. The same two tabs over the **current** week, reached from
  `/dashboard`'s "Edit Weekly Plan". It is deliberately not step 3 pointed at this week: that step's
  Next means "finish planning" and gates on there being a task, whereas this is open it, move one
  thing, save, go back. It uses the **sidebar layout** despite its URL, because that is where it is
  reached from and where it returns to.
  **Every day of the week is live here, including the ones that have passed** — `pastDays="open"`
  on both tabs. That is the whole point of the page: a task Tuesday didn't get done is dragged to
  Thursday, and Tuesday is where it is dragged *from*. So no `PastDaysNotice`; a line saying the
  opposite sits in its place.
  It takes no `?week_start=` — the current week is the only one the app treats as writable
  (`isEditableWeek`), and next week is still planned through the wizard.
  Nothing writes as you go: edits sit in local state until the sticky **Save bar**, which appears
  only while `useWeekSchedule().isDirty` (the same shape `/settings` uses). Back to Dashboard with
  changes outstanding asks first, since it is the one gesture that can silently throw them away.
- `/settings` — End-of-Day check-in time (`users.eod_time`) and Google Calendar, both API-backed.
  The calendar card connects through a **second, separate OAuth grant** from the one that signs a
  user in: `fetchCalendarConnectUrl()` returns the consent URL and the page navigates to it, because
  a browser redirect cannot carry the bearer token that says which account is connecting. The
  outcome comes back as `#calendar=connected` / `#calendar_error=` on the URL, which
  `_utils/use-calendar-settings.ts` reads and clears on mount — the same fragment convention
  `/login` uses for sign-in, and for the same reason: a fragment never reaches a server.
  Beside Disconnect (which deletes the HabitFlow calendar outright, so it confirms first) is a
  **Sync now** button that runs inline and reports what it wrote.
  Landing on `#calendar=connected` also **offers the first push in a dialog**, because connecting
  creates an *empty* calendar and auto-sync only fires on the next write — so a user who connects
  and then changes nothing watches a blank calendar and concludes the feature is broken. It is an
  offer rather than an automatic sync because the export categories sit right below it, unread. The
  fragment is cleared as it is read, so the offer belongs to the visit that connected.
  **Automatic sync is the paid half of this card**, and the only paid thing on it: Connect,
  Disconnect, **Sync now** and the export tree all work on Free. A free account gets the switch
  disabled and drawn **off** rather than as stored — the column keeps whatever was last set, so
  upgrading brings automatic sync back untouched, but a switch reading "on" while nothing syncs is
  exactly the failure recorded next.
  **The Allow Sync switch saves itself; the Save bar governs the export tree alone.** It used to sit
  behind that bar with the tree, and it read as broken — a switch that flips and then does nothing
  is indistinguishable from one that does not work, and the bar it was waiting on is further down
  the page beside a different control. The consequence was worse than cosmetic: the server was
  never told, so automatic sync silently never ran. It sends the *saved* export preference rather
  than the edited one, so flipping it cannot commit category edits still waiting on Save.
  **The export category tree is built from the user's real roles**, keyed on `role_id` rather than a
  slug of the name, and the checkboxes are converted to the server's *exclusion* shape only at the
  boundary (`toApiPreference` / `fromApiPreference`) — so the tri-state parent logic stays in terms
  of what is ticked, and a role added later arrives ticked. Everything in `_utils/categories.ts`
  therefore takes the category list as its first argument: with real roles there is no module-level
  constant left to close over.
- `/evening-reflections` — API-backed. Week list sidebar (a `n/7` badge per week, a date jump, and
  "Load older weeks"), the AI weekly summary, and a 7-day reflection grid. Every day of the week you
  are standing in is writable in any order — filling in Monday on Thursday, or Sunday early, are both
  normal. Once a week has passed its entries can be viewed but not changed. The summary is generated
  **once per week and never regenerated**, and unlocks only when all 7 reflections are written; a
  past week can still be summarised, since read-only applies to the reflections, not to this.
  It is also **Premium only**, and `isPremium` is deliberately kept apart from `canGenerate` rather
  than folded into it: that predicate's false branch is the "write all 7 reflections" line, which
  would be simply wrong for someone who has written all seven and just has not paid. A summary
  already written stays readable if a subscription lapses — it is a record of a week that happened,
  not a feature being used, and only generating a new one is gated.
- `/history` — API-backed. Past weeks only: the strip starts at *last* Monday, since the live week
  belongs to `/dashboard` and a goal in an unfinished week has no outcome yet.
  **A free account sees the 3 most recent finished weeks** (`FREE_TIER_LIMITS.historyWeeks`): the
  strip stops there, the date picker gains a `min` to match its `max`, and "Load older weeks" is
  replaced by the upgrade offer — the server genuinely will not return the rest, so listing rows it
  could never fill would be listing rows that do nothing. `premium` starts `null` and the strip is
  capped until it lands, so the answer arriving can only ever *add* weeks, never take one back. An
  out-of-window `?week_start=` is clamped exactly as a future one already was. Week list sidebar
  (a tasks-done badge per week, a date jump, and "Load older weeks"), a stats row of ratios
  (goals achieved, tasks done, Sharpen the Saw activities, fixed appointments), role goals marked with how
  each resolved, Sharpen the Saw activities, and a schedule grid whose every chip names the role or
  dimension it served and whether it was done. Both cards carry a legend of only the markers that
  week used, and the schedule's is split into rows — role goals, Sharpen the Saw, other — because a
  role name and a dimension label are indistinguishable listed flat. The `dropped` outcome is shown
  as **"Removed"**: "dropped" is the model's word (`Goal#dropped?`) and reads to a user as giving
  up rather than as an edit, so the wording stops at the type boundary. A goal left unfinished in a
  week it was *carried out of* reads **"Carried on"** rather than "Missed", and one continuing an
  earlier week carries an `n-th week` badge — the page's sharpest signal, since a goal on its fifth
  week is asking to be broken down or dropped. It is the one surface that
  reads a week **as it was recorded**: goals under a since-archived role, goals since dropped and
  activities since deleted all still appear, flagged — which is why it has its own endpoints rather
  than composing `/roles` and `/sharpen-the-saw-activities`, both of which filter to `.active`.
- `/analytics` — API-backed, and **Premium only**: the server answers 402 to a free account, and
  `_utils/use-analytics.ts` turns that into `isLocked` rather than an error toast, so the page keeps
  its own heading and renders `<PremiumLock>` where the grid would be instead of bouncing anywhere.
  It is the one gated surface with no `premium` flag to read, because its only request is the one
  being refused. 2×2 grid: sharpen-the-saw radar, role task table, daily priority bar
  chart, weekly goal completion trend. Like `/history` it reads **finished weeks only**, so the
  newest week it knows about is last week and the completion card's corner figure is labelled "last
  week"; the week in progress belongs to `/dashboard`. The whole window — up to 52 finished weeks —
  is fetched **once** by `_utils/use-analytics.ts`, and every card filters it in the browser, so
  moving a selector never costs a request. Three of the four cards keep their own filter, which is
  why they stay in `useState` rather than the URL: none of the three names what the page is about.
  Those filters select **weeks, not dates** — a picked date only names the week it falls in, and
  the whole of that week is in or out, which is all the API can report anyway. The selectors say
  "From week of" and print the span they resolved to, so the mapping is never a silent surprise.
  Every card carries a **"How does this work?"** disclosure (`_components/metric-info.tsx`,
  copy in `_constants/analytics.ts`): a click-to-open panel rather than a hover tooltip, since the
  explanations run to several sentences and a hover target is no use on a touch screen. Each says
  what its big number is *and* what it leaves out — a share is not a completion rate and a dropped
  goal is not a missed one, neither of which a new user has any reason to guess.
  The radar is a **distribution, not four completion rates**: each dimension's figure is its share
  of the Sharpen the Saw tasks completed across the range, so the four add up to 100 and an even 25% each is
  a balanced week — which is what Habit 7 is actually asking. A completion rate could not say that,
  since a dimension with one scheduled task that got done reads 100% while contributing almost
  nothing. The corner figure collapses the split into one number: total distance from an even share,
  scaled so covering k of the four dimensions evenly scores (k − 1) / 3 — one dimension 0%, two 33%,
  three 67%, all four 100%. Counts are pooled across the range rather than the weeks' shares
  averaged, so a quiet week does not weigh as much as a busy one.
  The completion card counts **goals**, not tasks, which is what makes its "Removed" column mean
  something: dropped goals sit outside the ratio, the same rule `/history` follows.
- `/admin/dashboard` — API-backed, and the whole of the admin area: **an admin account has exactly
  one page.** It reads other people's accounts, which nothing else in this app does.
  It has **its own `<AdminHeader>` rather than the `<Sidebar>`**, and `proxy.ts` redirects an admin
  away from every other route to here. An admin runs no week — no roles, no goals, no plan — so
  `/dashboard` would draw an empty calendar and `/weekly-plan/goals` would invite it to plan a week
  nobody will read; a nav of nine links that all bounce is worse than no nav.
  The redirect lives in `proxy.ts` (Next 16's name for `middleware.ts`) rather than in
  `useRequireAuth`, because `/roles`, `/settings` and `/sharpen-the-saw` never call that hook — a
  guard there would have covered most of the app and silently missed three pages. It also runs
  before render, so there is no frame of the dashboard before the bounce.
  **The claim routes; the server authorises.** `isAdmin` comes off the JWT and decides only which
  page to send a session to; the three `/admin/*` requests re-check `users.is_admin`, so a non-admin
  who types the URL is deliberately let through to be refused — `<AdminDenied>` renders where the
  grid would be, the same shape `/analytics` uses for its 402. It makes no upgrade offer, because
  admin is not for sale. **The restriction is client-side**: the user-facing API would still answer
  an admin's token, and nothing asks it to.
  Four stat tiles, a revenue-by-month bar chart, a subscription-state breakdown, then the two
  tables. **The revenue chart's `XAxis` is keyed on the `YYYY-MM` bucket, never on the printed
  label** — thirteen months is a span with an August at each end, and Recharts keys its category
  axis on that `dataKey`, so a duplicate label made the two indistinguishable and a hover over the
  newer August resolved to the older one's (empty) row. `monthTick` prints the year at the first
  tick and at each January, the two places it changes, so the axis reads apart as well. The user table's **Plan** column names a plan — Premium or Free, from the server's own
  `premium?` — with Stripe's status underneath only when it says something the plan word cannot
  (`Trialing` on a premium row, `Past due` or `Canceled` on a free one). "Active" is the state of a
  subscription, not the name of a plan, and beside a money column it reads as though the account is
  active, which every account in the table is. **Both tables paginate on the server**, unlike `/analytics`, which fetches its window once
  and slices it in the browser: a year of weekly counts has a ceiling and "every account that ever
  signed up" does not. `_utils/use-paged-list.ts` is the one hook both use — the page turn, the
  filter reset and the race guard are identical for users and for payments, and a second copy is a
  second chance to get the race guard wrong. It derives `isLoading` from *which request the held
  page answered* rather than keeping a flag, the same trick `use-analytics.ts` uses, and it is that
  shape which lets rows survive a page turn: the table dims instead of emptying, so paging does not
  collapse the card and bring it back.
  Searching is debounced and the term is sent as a query param the server escapes — a `%` typed into
  the box is a character, not a wildcard matching every account.
  Every panel is a labelled `<section>`, so "Active" and "Premium" — words that legitimately appear
  in a stat tile, a subscription state and a user's plan at once — are reachable unambiguously by a
  screen reader and by `tests/e2e/admin-dashboard.spec.ts`.
- `/subscription` — API-backed. The only surface that takes money, and the only one whose state this
  app does not own. A current-plan card, then the same `<PlanComparison>` that ends onboarding.
  **RM 25/month, MYR, through hosted Stripe Checkout** — the browser leaves for a page Stripe hosts,
  so no Stripe package is installed here and no card field is ever rendered. The price is *not* a
  constant in `lib/plans.ts`: it arrives on `GET /subscription` straight from Stripe, so the figure on
  this page cannot disagree with the figure on the card form. Cancel, resume, card and invoices are
  all the Stripe Billing Portal, offered only once `manageable` says there is a customer to show.
  `_utils/use-subscription.ts` follows `/settings`' calendar hook — leave, come back with the outcome
  on the URL, read it once and clear it with `replaceState` so a refresh is not a second toast —
  **except that the outcome is a query param, not a fragment.** `/settings` uses `#calendar=connected`
  because a fragment never reaches a server; Stripe substitutes the session id into the `success_url`
  query only, and the page has to hand that id back to `POST /subscription/confirm`. That confirm is
  why the page reads Premium the instant the browser is back rather than waiting on the webhook.

## Layout conventions

- `/admin/dashboard` is the one page in neither shape: a full-width `<AdminHeader>` above
  `<main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">`, inside a
  `flex flex-col h-screen` column. It is not a dashboard-area page — an admin account is not a user
  of this app — so it takes neither the sidebar nor `AppNav`.
- Onboarding and weekly-plan **wizard** pages: `<AppNav>` → `<main className="relative z-10 px-6 py-8">` →
  `<div className="max-w-7xl mx-auto">`.
- Dashboard and post-onboarding pages use a **sidebar layout**:
  `<div className="flex h-screen overflow-hidden bg-background">` → `<Sidebar />` →
  `<main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">`. No `AppNav`, no `max-w` wrapper.
  **The layout follows the page, not the URL segment**: `/weekly-plan/edit` sits under
  `/weekly-plan` but is a dashboard-area page — it is reached from `/dashboard` and returns there,
  and it is not a step with a Next — so it takes the sidebar layout and its own Back button.
- Background decoration on every page: two fixed blurred blobs (`bg-primary/10` top-left,
  `bg-secondary/20` bottom-right).
- **`<Toaster />` comes before `{children}` in `app/layout.tsx`, and the order is load-bearing.**
  Sonner replays nothing to a subscriber that arrives late, so a page toasting from a mount effect
  — `/login` reading `#error=` off a Google callback, the onboarding guard turning an onboarded user
  away — reaches an empty subscriber list if the Toaster mounts second.

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
   **The whole weekly calendar lives there too** — `_types/calendar.ts`, `_constants/calendar.ts`,
   `_utils/{calendar,time,tasks,use-plan-week,use-week-schedule}.ts` and the seven components from
   `CalendarDayHeader` to `FixedTab`/`TasksTab`. It was `/weekly-plan/schedule`'s private code until
   `/weekly-plan/edit` needed the same calendar; hoisting it is rule 3 working as intended, and is
   why `schedule/` is now a bare `page.tsx`.
4. **Genuinely app-wide UI lives in `components/`**, not in a route folder — `AppNav`, `Sidebar`,
   `OnboardingStepper`, the clash modals, `CalendarLegend` (drawn by all three calendars), and the
   shadcn primitives in `components/ui/`. Shared non-UI domain constants go in `lib/` —
   `lib/sharpen-the-saw-dimensions.ts` and `lib/role-colors.ts` (the role palette, the reserved
   yellow and the fixed-appointment blue; needed by `/roles`, `/weekly-plan/*`, `/dashboard`,
   `/history`, `/analytics` and both onboarding calendars).
5. **Derived/filtered data belongs in `_utils`, raw data in `_constants`.** `/analytics` is the model:
   `_constants/analytics.ts` holds the window sizes and label lists, `_utils/analytics.ts` holds the
   pure derivations (`getSharpenData`, `getRoleStats`, `getDailyPriority`) and `_utils/use-analytics.ts`
   owns the one fetch that feeds them.
6. Routes that are genuinely trivial (`/onboarding/complete` is pure markup) may stay a single
   `page.tsx` — but add the folders as soon as they grow logic, types, or repeated markup.

`/analytics` is the reference implementation of a route that owns its own private folders, and
`/weekly-plan` of a flow whose routes share them.

## State management

There is no global data store: state is local `useState` per route, and routes that persist talk to
the Rails API through `lib/api.ts`. Auth is the one exception — a JWT in a cookie-backed zustand
store (`stores/auth-store.ts` + `lib/cookie-storage.ts`).

Every route that persists anything is API-backed: `/login`, all four data-writing onboarding steps,
`/dashboard`, `/sharpen-the-saw`, `/roles`, `/settings`, `/evening-reflections`, `/history`,
`/analytics`, `/admin/dashboard`, all three `/weekly-plan/*` steps and `/weekly-plan/edit`. Nothing
is mock-backed any more — `/settings`' Google Calendar card was the last holdout, and its
`MOCK_ROLES` are gone.

**Every request carries an `X-Time-Zone` header**, set once in `request()` in `lib/api.ts` from
`Intl.DateTimeFormat().resolvedOptions().timeZone`. A Google Calendar event needs a zone, and the
server stores none — for the same reason it never derives "the current week". So the browser sends
it per request exactly as it sends `week_start`, as a header rather than a body field because the
endpoints that need it are about tasks, goals and roles: the zone is request metadata, not part of
what is being saved.

**A failed request throws an `ApiError`, which carries `res.status`.** It used to be a bare `Error`
with the server's sentence and nothing else, which made **402 Payment Required** — how the API says
"this is a Premium feature" — indistinguishable from a 422. Nothing else in this app answers 402, so
`isPaymentRequired(error)` is all a page needs to render an upgrade offer instead of a red line.
Additive: an `ApiError` is still an `Error`, so every caller reading `.message` is unchanged.

**Which tier the account is on rides on the response each gated page already waits for** — a
top-level `premium` on `fetchEveningReflections`, every calendar response, and `fetchHistoryWeeks`.
There is no store for it and no `GET /me`: the backend keeps `premium?` out of the JWT deliberately
(a 7-day cookie claim cannot be revoked when a plan lapses in minutes), and an answer that arrives
with the data cannot draw a control unlocked and then take it back. `/analytics` is the exception,
reading the 402 itself.

**"Has this week passed?" is a client decision**, like every other date in this app — the server
stores no timezone and keeps only a loose backstop that can never fire for a real user. It lives in
`lib/date.ts` (`isPastWeek`/`isFutureWeek`/`isEditableWeek`, alongside `weekStartsBack`, which
generates a week strip), which compares `YYYY-MM-DD` Mondays as strings. `isPastDayIndex` answers
the same question one level down — has this *day* of the displayed week gone? — for the calendars. These four were hoisted out
of `app/evening-reflections/_utils/weeks.ts` when `/history` grew a strip of its own: a route may
not import another route's private folder, and a second copy of "has this week passed" is exactly
what `lib/date.ts` exists to prevent.

**A task is ticked off in one of two places on `/dashboard`**, both writing
`tasks.is_completed` through `PATCH /tasks/:id/completion` and both reporting back through the same
`onCompletionChange(changed)` callback, which `page.tsx` patches its held plan from. The End-of-Day
check-in seeds itself from what is already stored and sends only what changed, so saving twice does
not untick the first save. It sends the completions first and reports them before the reflection
call can throw, so a failed reflection leaves a retry with nothing left to re-tick. The task detail
dialog sends the one task it is showing, and because the task it renders is derived from that held
plan rather than copied into state, the patch flows back in and flips the button — which is why it stays open afterwards rather than confirming with a toast.

Routes with API state follow `/sharpen-the-saw` and `/roles`: a `let cancelled = false` effect for
the initial load, an `isLoading` guard, and each write sent before local state is patched from the
response, with `toast.error("Couldn't … — please try again.")` on failure. `/roles` keeps that
lifecycle in `_utils/use-roles.ts` so `page.tsx` stays under the 250-line cap.

**Beyond auth, nothing is kept in `localStorage`.** The End-of-Day check-in used to be the one
exception — `eod_time` and `eod_shown_date` — and both moved server-side, because a browser key
cannot answer "have I already checked in tonight?" for a user with a laptop *and* a phone. The time
is now `users.eod_time` and the answer is a `check_ins` row, and both arrive on the weekly-plan
response the dashboard already waits for, so deciding whether to prompt costs it no extra request
and never flashes a prompt it then takes back.

What is left in `lib/` is the clock half of that decision: `app/dashboard/_utils/eod.ts`
(`isCheckInDue`) asks only whether the configured time has passed, and `lib/eod.ts` holds the
fallback shown before the first response lands. `lib/reflections.ts` holds `MAX_REFLECTION_LENGTH`
because `/dashboard` and `/evening-reflections` write the same column and mirror the same
server-side limit, and a route may not import another route's private folder.

Radix mounts a dialog's contents only while it is open, which is why the check-in is split in two:
`end-of-day-modal.tsx` is the shell and `end-of-day-check-in.tsx` is the body. Every opening is a
fresh mount of the body, so its state starts from what the server currently holds rather than from
whatever the last visit left behind — there is no resetting on close to get wrong.

**Goals are week-scoped.** Roles persist week to week; goals belong to exactly one weekly plan, so
every roles/goals request carries a `week_start`. Nothing is hard-deleted — see the root
`CLAUDE.md` and `ERD_businnes_rules.md`.

## Shared components

- `components/ui/` — shadcn-generated primitives (Button, Input, Dialog, AlertDialog, Tabs, …).
  **`tabs.tsx` and `separator.tsx` deviate from what shadcn generates, deliberately.** As generated
  they styled themselves with `data-horizontal:` / `data-vertical:`, which this Tailwind v4 setup
  compiles to the literal attribute selectors `[data-horizontal]` / `[data-vertical]` — attributes
  Radix never sets. It sets `data-orientation`, so every one of those rules silently did nothing
  and `/weekly-plan/schedule` drew its tab list as a full-height column beside the calendar instead
  of a row above it. They now use `data-[orientation=horizontal]:` and key off the real attribute;
  `Tabs` also forwards `orientation` to Radix rather than stamping `data-orientation` by hand, so
  the root, its list and the arrow-key navigation cannot disagree. **Re-running `shadcn add tabs`
  or `separator` will reintroduce this** — the breakage is invisible in a diff and shows up only as
  a mislaid layout.
- `components/app-nav.tsx` — Top nav for onboarding/weekly-plan pages. Props: `action` ("back"|"next"),
  `nextHref`, `nextEnabled`, `onNext`, `backHref`, `extra`. When `nextEnabled && nextHref` it renders a
  `<Link>`; otherwise a disabled or `onNext`-callback button.
- `components/sidebar.tsx` — Fixed left nav for dashboard-area pages; highlights the active route via
  `usePathname()`. **No Admin item, deliberately** — an admin never reaches a page that renders this
  sidebar, so the link would only ever be drawn for the accounts that cannot use it.
- `components/premium-lock.tsx` — The one way this app says "you have not paid for this". Props:
  `title`, `description`, `variant` ("card" for a whole surface, "inline" for a control that sits
  inside one that still works). Upgrading is a **link to `/subscription`**, never a checkout call:
  that page owns the Stripe handoff and reads the real price, so four copies of
  `createCheckoutSession` would be four places for the figure on screen to drift from the card form.
- `components/plan-comparison.tsx` — The Free vs Premium comparison. App-wide rather than route-private
  because `/subscription` and `/onboarding/complete` are in different flows and neither may import the
  other's `_*` folder. Props: `currentPlan`, `plan` (the price, from the API), `onUpgrade`, `isBusy`.
  Both tiers list the same rows in the same order so the columns read across; `tests/unit/plans.test.ts`
  pins that. It emphasises Premium with `--primary`, and uses `bg-accent` for the upgrade button alone
  — the CTA role the guidelines reserve yellow for, and deliberately not a second claim on it.
- `components/onboarding-stepper.tsx` — 5-step progress indicator. Props: `currentStep` (1–5).
- `components/clash-warning-modal.tsx` — Warning dialog for exactly 1 overlapping appointment.
  Props: `open`, `conflictingTitle`, `onProceed`, `onCancel`.
- `components/clash-block-modal.tsx` — Hard-block dialog for 2+ overlaps. Props: `open`, `onClose`.
- `components/past-days-notice.tsx` — The line above each editable calendar naming the days it has
  blocked off. Props: `todayIdx`, `creates`. Renders nothing when no day has passed.
- `components/animated-schedule.tsx` — Hero animation showing a draggable schedule demo.
- `components/theme-provider.tsx` — `next-themes` wrapper.

Landing-page sections are **not** here — they are route-private in `app/_components/`, since only `/`
uses them. (A superseded v1 landing design used to live in `components/landing/`; it was deleted once
v2 replaced it. Recover from git at `1937e12` if ever needed.)

## Calendar implementation notes

The four editable calendar routes (`/onboarding/fixed-appointments`, `/onboarding/schedule-tasks`,
`/weekly-plan/schedule`, `/weekly-plan/edit`) plus the read-only `/dashboard` timetable share the
same geometry constants: `CAL_START=6`, `CAL_END=22`, `HR_PX=64`, `TOTAL_HRS = CAL_END - CAL_START`.
The two onboarding steps and the dashboard each keep their own `_constants/calendar.ts`; the two
`/weekly-plan` routes share one calendar outright, at `app/weekly-plan/_constants/calendar.ts`.

- Drag uses an invisible ghost image so the native drag preview is hidden; the drop position is
  computed from `colRefs`.
- `dragInfo` is a `useRef` (not state) to avoid stale-closure bugs in the `onDrop` handler.
- `PendingAction` is a union discriminated by `type: "drop" | "save"`, shared between the drag-drop and
  edit-save clash flows.
- `getOverlaps(all, dayIndex, startMins, endMins, excludeId)` returns overlapping items.
- `getPositionStyle(item, allItems)` returns `left/right/width` inline styles; two overlapping events
  split the column 50/50, sorted by `(startMins, id)` for stable column assignment.
- **A day that has passed is blocked, not just dimmed.** The *planning* calendars withhold
  `onClick`, `onDragOver` and `onDrop` from any column before today, so a click opens nothing and
  the column never becomes a drop target — the browser draws the no-drop cursor itself. The day
  picker in each add/edit modal disables those days too, *except* the one the item already sits on,
  so renaming a task that is already behind is not a one-way trip off its own day. The predicate is
  `isPastDayIndex(todayIdx, dayIndex)` in `lib/date.ts`, and `components/past-days-notice.tsx` is
  the sentence above each calendar that states the rule rather than leaving it to be discovered.
  Both fall silent when nothing is blocked: a Monday, a week that is not the current one
  (`todayIdx === -1`), and the server render (`null`).
- **`/weekly-plan/edit` is the exception, and it is a `PastDayPolicy`, not a special case.** The
  rule exists because work scheduled into a day that is gone could never be done — which says
  nothing about *moving* work off one, the entire reason that page exists. `FixedTab`, `TasksTab`
  and `CalendarDayHeader` take `pastDays: "block" | "open"` (default `"block"`), and each tab
  collapses it to one `blockedBefore` index that every check below reads: `null` means nothing is
  blocked, which is already what `isPastDayIndex` answers for a week that is not the current one.
  `"open"` also drops the dimming, since greying out a column the calendar will happily accept a
  drop on would be a lie. Today's pill is drawn either way.

### Task colour

**One rule, every calendar: a block is drawn in the colour of the thing it belongs to.**
A task takes its role's colour or its Sharpen the Saw dimension's; a fixed appointment takes
`FIXED_COLOR`; a task with no link left resolving takes the unlinked grey. `/onboarding/schedule-tasks`,
`/weekly-plan/schedule`, `/weekly-plan/edit`, `/dashboard` and `/history` all do this. They used to
disagree — the two planning calendars tinted by role while onboarding and the dashboard painted one
flat purple — and the legend went on naming that purple on all four.

**`WEEKLY_PRIORITY_COLOR` (`#FFCC00`) overrides it, and is applied at paint time, not baked in.**
A task serving a goal the user named a weekly priority is drawn yellow whatever role it belongs to,
so a glance across the week finds what matters most first. But the *category* colour is what every
model keeps (`CalEvent.color`, `HistoryEvent.color`, `LegendCategory.color`), and the card applies
the override itself — otherwise the legend would file a weekly-priority task under "yellow" instead
of under its role, which is the one place its role is still named. A fixed appointment is exempt and
stays blue: it belongs to no goal, so it can never really be a weekly priority.
A *daily* priority is a star, never a colour — see the palette's own comments for why.

**The four palettes are disjoint by rule** — role colours, dimension colours, the reserved yellow,
and the fixed-appointment blue. They share one grid, so a colour that could be two of them makes the
legend under it wrong. Four of the five role colours were byte-identical to the four dimension
colours until this was written down; `tests/unit/roles.test.ts` now holds all four apart, and
`lib/role-colors.ts` is where the yellow and the blue live so there is one place to break.

**`components/calendar-legend.tsx` is the legend all three calendars draw.** Callers pass one
`LegendCategory` per block on the grid — duplicates expected — and it folds them by `kind:label`
into rows: *Role goals*, *Sharpen the Saw*, *Priority* (the yellow swatch and the star, which cut
across the other rows), and *Other* (fixed appointments, unlinked tasks, and the dashboard's "Now"
rule). Only the rows the week actually uses are drawn, the rule `/history`'s footer legend already
followed: explaining a swatch that is nowhere on the grid invites exactly the question a legend
exists to answer. It renders a `<section aria-label="Calendar legend">`, which is also how the e2e
specs address it. `/history` keeps its own legend rather than sharing this one — its chips carry
category icons and its rows are per-week outcomes, not a live grid's key.
