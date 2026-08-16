import type { Week } from "../_types"

function fmt(d: Date): string {
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`
}

/** Returns `count` weeks ending with the week containing `today`, most recent first. */
export function generateWeeks(today: Date, count = 8): Week[] {
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

  const weeks: Week[] = []
  for (let i = 0; i < count; i++) {
    const start = new Date(monday)
    start.setDate(monday.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    weeks.push({
      id: `week-${i}`,
      label: `${fmt(start)} – ${fmt(end)}`,
      reflections: {},
      summary: "",
    })
  }
  return weeks
}

export function hasAnyReflection(week: Week): boolean {
  return Object.values(week.reflections).some(r => !!r?.text)
}
