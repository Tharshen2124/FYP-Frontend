export function fmtTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
}

/** Returns short date label like "May 27" */
export function fmtShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
