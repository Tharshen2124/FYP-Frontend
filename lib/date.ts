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

/**
 * Parses a `YYYY-MM-DD` local date param back into a local-midnight `Date`.
 *
 * The `T00:00:00` suffix is what keeps it local: `new Date("2026-08-24")` is parsed as UTC
 * midnight and reads as the 23rd anywhere west of Greenwich.
 */
export function parseLocalDate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

/** True when `value` is a `YYYY-MM-DD` date that falls on a Monday — the client-side mirror of the
 *  server's `parse_week_start`, so a hand-edited URL is caught before it becomes a 422. */
export function isWeekStart(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = parseLocalDate(value)
  return !Number.isNaN(d.getTime()) && d.getDay() === 1
}

/** The Monday `weeks` weeks after `weekStart`; pass a negative number to go back. */
export function shiftWeekStart(weekStart: string, weeks: number): string {
  const d = parseLocalDate(weekStart)
  d.setDate(d.getDate() + weeks * 7)
  return localDateParam(d)
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * A week named the way the planning flow shows it: `"Mon 24 – Sun 30 Aug"`, or
 * `"Mon 29 Sep – Sun 5 Oct"` when it straddles two months.
 */
export function formatWeekRange(weekStart: string): string {
  const start = parseLocalDate(weekStart)
  const end = parseLocalDate(shiftWeekStart(weekStart, 1))
  end.setDate(end.getDate() - 1)

  // Spelled out rather than taken from Intl: `toLocaleDateString` abbreviates September as "Sept"
  // in en-GB and "Sep" elsewhere, so the label would shift with the runtime's locale data.
  const month = (d: Date) => MONTHS[d.getMonth()]
  const sameMonth = start.getMonth() === end.getMonth()

  return sameMonth
    ? `Mon ${start.getDate()} – Sun ${end.getDate()} ${month(end)}`
    : `Mon ${start.getDate()} ${month(start)} – Sun ${end.getDate()} ${month(end)}`
}

/**
 * A span of whole weeks named the way a single one is: `"Mon 20 Jul – Sun 16 Aug"`, collapsing to
 * `formatWeekRange` when both ends land in the same week.
 *
 * Both arguments are Mondays. /analytics uses it to spell out what a From/To pair resolved to,
 * since those filters select *weeks* and a date is only a way of naming the one it falls in.
 */
export function formatWeekSpan(fromWeekStart: string, toWeekStart: string): string {
  if (fromWeekStart === toWeekStart) return formatWeekRange(fromWeekStart)

  const start = parseLocalDate(fromWeekStart)
  const end = parseLocalDate(shiftWeekStart(toWeekStart, 1))
  end.setDate(end.getDate() - 1)

  // Unlike a single week, a span can sit in the same month a year apart, so the year counts here.
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()

  return sameMonth
    ? `Mon ${start.getDate()} – Sun ${end.getDate()} ${MONTHS[end.getMonth()]}`
    : `Mon ${start.getDate()} ${MONTHS[start.getMonth()]} – Sun ${end.getDate()} ${MONTHS[end.getMonth()]}`
}

/**
 * The most recent week that has finished: the one before the week the user is standing in.
 *
 * /history and /analytics both stop here rather than at the live week. The live week belongs to
 * /dashboard, which draws it as it stands rather than as it turned out — a goal in an unfinished
 * week has no outcome yet, and a week still running would read low and climb all week.
 */
export function latestPastWeekStart(today: Date = new Date()): string {
  return shiftWeekStart(localWeekStartParam(today), -1)
}

/**
 * The `count` Mondays ending at `latest`, most recent first.
 *
 * The week strips on /evening-reflections and /history are generated here rather than taken from
 * the server, so that a week the user never planned still appears — reading 0/7 or 0/0 rather than
 * leaving a hole. The server only knows about weeks that have a plan, and a strip with gaps in it
 * would be harder to read than one that shows them.
 */
export function weekStartsBack(latest: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftWeekStart(latest, -i))
}

/**
 * Whether `weekStart` names a week that has finished.
 *
 * This decision belongs to the client: it is the only party that knows the user's local date, the
 * same reason every `week_start` in this app is client-derived. The server keeps a deliberately
 * looser backstop so the two can never disagree in a way that blocks a real user.
 *
 * Both values are `YYYY-MM-DD` Mondays, and ISO dates sort lexicographically, so a string compare
 * is the whole comparison — no Date objects and no timezone to get wrong.
 */
export function isPastWeek(weekStart: string, today: Date = new Date()): boolean {
  return weekStart < localWeekStartParam(today)
}

/** True for a week that has not started yet, which a strip never offers but a URL can name. */
export function isFutureWeek(weekStart: string, today: Date = new Date()): boolean {
  return weekStart > localWeekStartParam(today)
}

/** A week is writable exactly when it is the one the user is standing in. */
export function isEditableWeek(weekStart: string, today: Date = new Date()): boolean {
  return !isPastWeek(weekStart, today) && !isFutureWeek(weekStart, today)
}
