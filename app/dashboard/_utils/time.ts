export function fmtTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
}

/** Returns the Monday of the week containing `date` */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Returns short date label like "May 27" */
export function fmtShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
