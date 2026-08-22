export function fmtTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
}

/** Returns short date label like "May 27" */
export function fmtShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** Parses an "HH:MM" clock time into minutes past midnight. */
export function strToMins(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/**
 * How long a task runs, as words. The grid only ever implies this through a card's height, and a
 * 30-minute block and a 45-minute one are four pixels apart.
 */
export function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
