import { describe, it, expect } from "vitest"
import {
  availableYears,
  getDailyPriority,
  getRoleStats,
  getSharpenData,
  getWeekForDate,
  getWeekLabel,
  getWeeklyCompletions,
  getWeeksInRange,
  toAnalyticsWeek,
} from "@/app/analytics/_utils/analytics"
import type { DateSelection } from "@/app/analytics/_types"
import type { ApiAnalyticsWeek } from "@/lib/api"

/** `month` is 0-indexed, matching `DateSelection`: 7 is August. */
const d = (day: number, month: number, year = 2026): DateSelection => ({ day, month, year })

// Three consecutive finished weeks, newest first as the API returns them.
const API_WEEKS: ApiAnalyticsWeek[] = [
  {
    week_start: "2026-08-10",
    end_date: "2026-08-16",
    dimensions: [
      { dimension: "physical", completed: 3, total: 4 },
      { dimension: "mental", completed: 2, total: 2 },
    ],
    roles: [
      { role_id: 1, name: "Programmer", color_id: "primary", completed: 16, total: 20 },
      { role_id: 2, name: "Athlete", color_id: "teal", completed: 9, total: 20 },
    ],
    daily_priorities: [
      { day_of_week: 0, completed: 3, total: 3 },
      { day_of_week: 2, completed: 1, total: 2 },
    ],
    goals: { achieved: 5, total: 7, dropped: 1 },
  },
  {
    week_start: "2026-08-03",
    end_date: "2026-08-09",
    dimensions: [
      { dimension: "physical", completed: 1, total: 2 },
      { dimension: "social", completed: 2, total: 2 },
      // Not one of the four the client knows how to draw.
      { dimension: "financial", completed: 5, total: 5 },
    ],
    // No Athlete this week: a role the range only partly covers still belongs in the table.
    roles: [{ role_id: 1, name: "Programmer", color_id: "primary", completed: 12, total: 18 }],
    daily_priorities: [{ day_of_week: 6, completed: 0, total: 1 }],
    goals: { achieved: 6, total: 6, dropped: 0 },
  },
  {
    week_start: "2026-07-27",
    end_date: "2026-08-02",
    dimensions: [],
    roles: [{ role_id: 3, name: "Reader", color_id: null, completed: 4, total: 4 }],
    daily_priorities: [],
    goals: { achieved: 2, total: 5, dropped: 2 },
  },
]

const weeks = API_WEEKS.map(toAnalyticsWeek)

// The two most recent weeks, which several cases below range over.
const AUG_3 = d(3, 7)
const AUG_16 = d(16, 7)

describe("toAnalyticsWeek", () => {
  it("resolves role colours from the id, falling back when the role has none", () => {
    expect(weeks[0].roles.map(r => r.color)).toEqual(["#B13BFF", "#14b8a6"])
    expect(weeks[2].roles[0].color).toBe("#B13BFF")
  })

  it("drops a dimension the client has no metadata for", () => {
    expect(weeks[1].dimensions.map(x => x.dimension)).toEqual(["physical", "social"])
  })

  it("carries ids across as strings, the way every other route holds them", () => {
    expect(weeks[0].roles[0].roleId).toBe("1")
  })
})

describe("getWeeksInRange", () => {
  it("returns the single week a one-week range covers", () => {
    expect(getWeeksInRange(weeks, d(10, 7), AUG_16).map(w => w.weekStart)).toEqual(["2026-08-10"])
  })

  it("returns every intersecting week, newest first", () => {
    expect(getWeeksInRange(weeks, d(27, 6), AUG_16).map(w => w.weekStart)).toEqual([
      "2026-08-10",
      "2026-08-03",
      "2026-07-27",
    ])
  })

  it("treats a reversed range the same as a forward one", () => {
    expect(getWeeksInRange(weeks, AUG_16, AUG_3)).toEqual(getWeeksInRange(weeks, AUG_3, AUG_16))
  })

  it("returns nothing when no planned week falls in the range", () => {
    expect(getWeeksInRange(weeks, d(1, 0, 2020), d(31, 0, 2020))).toEqual([])
  })
})

describe("getWeekForDate", () => {
  it("matches the week containing the date, inclusive of both ends", () => {
    expect(getWeekForDate(weeks, d(10, 7))?.weekStart).toBe("2026-08-10")
    expect(getWeekForDate(weeks, AUG_16)?.weekStart).toBe("2026-08-10")
    expect(getWeekForDate(weeks, d(9, 7))?.weekStart).toBe("2026-08-03")
  })

  it("is null for a date in a week that was never planned", () => {
    expect(getWeekForDate(weeks, d(17, 7))).toBeNull()
  })
})

describe("getSharpenData", () => {
  it("returns one entry per dimension, always all four", () => {
    expect(getSharpenData(weeks, AUG_3, AUG_16).map(x => x.dimension)).toEqual([
      "Physical",
      "Spiritual",
      "Mental",
      "Social / Emotional",
    ])
  })

  it("reports the week's own completion rate when the range covers one week", () => {
    // Physical 3/4, mental 2/2; nothing scheduled for the other two.
    expect(getSharpenData(weeks, d(10, 7), AUG_16).map(x => x.score)).toEqual([75, 0, 100, 0])
  })

  it("pools the counts across a range rather than averaging the weeks' percentages", () => {
    // Physical is 3/4 then 1/2: pooled 4/6 = 67, where averaging 75% and 50% would say 63.
    expect(getSharpenData(weeks, AUG_3, AUG_16)[0].score).toBe(67)
  })

  it("scores a dimension the range scheduled nothing for as zero", () => {
    expect(getSharpenData(weeks, AUG_3, AUG_16)[1]).toMatchObject({
      dimension: "Spiritual",
      score: 0,
    })
  })

  it("zeroes every dimension when no week matches", () => {
    const data = getSharpenData(weeks, d(1, 0, 2020), d(2, 0, 2020))
    expect(data).toHaveLength(4)
    expect(data.every(x => x.score === 0)).toBe(true)
  })
})

describe("getRoleStats", () => {
  it("sums completed and total across the range", () => {
    const single = getRoleStats(weeks, d(10, 7), AUG_16)
    expect(single.find(s => s.role === "Programmer")).toMatchObject({ completed: 16, total: 20 })

    const twoWeeks = getRoleStats(weeks, AUG_3, AUG_16)
    expect(twoWeeks[0]).toMatchObject({ role: "Programmer", completed: 28, total: 38 })
  })

  it("keeps a role that only appears in some of the weeks", () => {
    // Athlete is absent from the week of 3 Aug but still owned tasks in the week of 10 Aug.
    expect(getRoleStats(weeks, AUG_3, AUG_16).map(s => s.role)).toEqual(["Programmer", "Athlete"])
  })

  it("orders by total, so the order does not shuffle as counts change", () => {
    const totals = getRoleStats(weeks, d(27, 6), AUG_16).map(s => s.total)
    expect(totals).toEqual([...totals].sort((a, b) => b - a))
  })

  it("never reports more completed than total", () => {
    for (const stat of getRoleStats(weeks, d(27, 6), AUG_16)) {
      expect(stat.completed).toBeLessThanOrEqual(stat.total)
    }
  })

  it("is empty when no week matches", () => {
    expect(getRoleStats(weeks, d(1, 0, 2020), d(2, 0, 2020))).toEqual([])
  })
})

describe("getDailyPriority / getWeekLabel", () => {
  it("returns seven days for a date inside a planned week", () => {
    const days = getDailyPriority(weeks, d(12, 7))
    expect(days.map(x => x.day)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
  })

  it("fills a day with nothing starred as 0/0 rather than leaving a hole", () => {
    const days = getDailyPriority(weeks, d(12, 7))
    expect(days[0]).toEqual({ day: "Mon", completed: 3, total: 3 })
    expect(days[2]).toEqual({ day: "Wed", completed: 1, total: 2 })
    expect(days[1]).toEqual({ day: "Tue", completed: 0, total: 0 })
  })

  it("returns nothing for a date in a week that was never planned", () => {
    expect(getDailyPriority(weeks, d(17, 7))).toEqual([])
  })

  it("labels the matched week the way the rest of the app names a week", () => {
    expect(getWeekLabel(weeks, d(12, 7))).toBe("Mon 10 – Sun 16 Aug")
    expect(getWeekLabel(weeks, d(17, 7))).toBe("No matching week")
  })
})

describe("getWeeklyCompletions", () => {
  it("reports goals achieved out of planned, with the dropped ones beside the ratio", () => {
    expect(getWeeklyCompletions(weeks)[0]).toEqual({
      id: "2026-08-10",
      label: "Mon 10 – Sun 16 Aug",
      completed: 5,
      total: 7,
      dropped: 1,
    })
  })

  it("takes the most recent weeks first, capped at the count asked for", () => {
    expect(getWeeklyCompletions(weeks, 2).map(w => w.id)).toEqual(["2026-08-10", "2026-08-03"])
  })

  it("is empty when nothing has been planned", () => {
    expect(getWeeklyCompletions([])).toEqual([])
  })
})

describe("availableYears", () => {
  it("offers every year the fetched weeks touch", () => {
    expect(availableYears(weeks)).toContain(2026)
  })

  it("still offers the current year when there is no history at all", () => {
    expect(availableYears([])).toEqual([new Date().getFullYear()])
  })
})
