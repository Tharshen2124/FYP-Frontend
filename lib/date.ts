/**
 * Local-date helpers shared across routes.
 *
 * Every `date`, `weekStart`, `from` and `to` value sent to the API is the user's **local**
 * calendar date (API_CONTRACT.md §0, "Client-derived dates are LOCAL dates"). The server
 * stores no timezone and deliberately never derives "today" or "the current week" itself —
 * "current is a client fact, never a server one".
 */

/**
 * Formats a Date as the `YYYY-MM-DD` local calendar date.
 *
 * Never use `toISOString().slice(0, 10)` for this — that is the UTC date. East of UTC it
 * reports yesterday shortly after local midnight; west of UTC it reports tomorrow late in
 * the evening. `getFullYear` / `getMonth` / `getDate` are local-clock by definition and
 * cannot drift that way.
 *
 * `weekStart` has a server-side backstop (a non-Monday is rejected with 422), but the bare
 * `date` params of §8.1 and §12.4 have none — a ±1 day error there is indistinguishable
 * from a legitimate timezone offset, so it would be accepted silently.
 */
export function localDateParam(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Returns the Monday of the week containing `date`, at local midnight.
 *
 * Lives here rather than in a route's `_utils` because the eight endpoints that take a
 * client-derived `weekStart` span `/weekly-plan/*`, `/analytics` and `/dashboard`.
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * The `weekStart` value every week-scoped endpoint expects: the local Monday, formatted as
 * a local date. Use this rather than composing the two helpers at each call site.
 *
 * Deriving this on the server from UTC is what API_CONTRACT.md §6/§7 now forbid: at UTC+8 the
 * first eight hours of local Monday are still Sunday in UTC (server would answer for *last*
 * week), and at UTC-5 late local Sunday is already Monday in UTC (server would answer for
 * *next* week). §6.2 is a full replacement of the goal selection, so that is a destructive
 * write against the wrong week, not just a stale read.
 */
export function localWeekStartParam(d: Date = new Date()): string {
  return localDateParam(getWeekStart(d))
}

/**
 * The seven dates of the week containing `date`, Monday first.
 *
 * Pairs with `day_of_week` on the backend, which is also Monday-indexed — `getWeekDays()[2]` is
 * the date a task with `day_of_week: 2` falls on.
 */
export function getWeekDays(date: Date = new Date()): Date[] {
  const start = getWeekStart(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

/** Weekday of `date` as 0 = Monday … 6 = Sunday, the same indexing the calendars use. */
export function getDayIndex(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7
}
