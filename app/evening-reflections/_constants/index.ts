import { type Week } from "../_types"

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export const SUMMARY_PLACEHOLDER =
  "This week showed meaningful progress across your daily reflections. You maintained consistency through mid-week, with particular depth on Wednesday and Thursday. Your reflections reveal a recurring theme of gratitude and focus on personal growth. Consider carrying forward your Wednesday insights into next week's planning."

function generateWeeks(): Week[] {
  const weeks: Week[] = []
  const today = new Date(2026, 4, 24)
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

  const fmt = (d: Date) => {
    const day = d.getDate()
    const month = d.toLocaleString("default", { month: "short" })
    return `${day} ${month}`
  }

  for (let i = 0; i < 8; i++) {
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

export const INITIAL_WEEKS = generateWeeks()
