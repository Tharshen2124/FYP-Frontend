import { describe, it, expect } from "vitest"
import {
  getDailyPriority,
  getRoleStats,
  getSharpenData,
  getWeekForDate,
  getWeekLabel,
  getWeeksInRange,
} from "@/app/analytics/_utils/analytics"
import { DEFAULT_FROM, DEFAULT_TO, WEEK_REGISTRY } from "@/app/analytics/_constants/mock-data"
import type { DateSelection } from "@/app/analytics/_types"

const d = (day: number, month: number, year = 2026): DateSelection => ({ day, month, year })

describe("getWeeksInRange", () => {
  it("returns the single week for the default range", () => {
    expect(getWeeksInRange(DEFAULT_FROM, DEFAULT_TO)).toEqual(["w1"])
  })

  it("returns every intersecting week, in registry order", () => {
    expect(getWeeksInRange(d(28, 3), d(1, 5))).toEqual(["w1", "w2", "w3", "w4", "w5"])
  })

  it("treats a reversed range the same as a forward one", () => {
    expect(getWeeksInRange(DEFAULT_TO, DEFAULT_FROM)).toEqual(getWeeksInRange(DEFAULT_FROM, DEFAULT_TO))
  })

  it("returns nothing outside the registry", () => {
    expect(getWeeksInRange(d(1, 0, 2020), d(31, 0, 2020))).toEqual([])
  })
})

describe("getWeekForDate", () => {
  it("matches the week containing the date, inclusive of both ends", () => {
    expect(getWeekForDate(d(26, 4))).toBe("w1")
    expect(getWeekForDate(d(1, 5))).toBe("w1")
    expect(getWeekForDate(d(25, 4))).toBe("w2")
  })

  it("is null outside the registry", () => {
    expect(getWeekForDate(d(1, 0, 2020))).toBeNull()
  })
})

describe("getSharpenData", () => {
  it("returns one entry per dimension", () => {
    const data = getSharpenData(DEFAULT_FROM, DEFAULT_TO)
    expect(data.map(x => x.dimension)).toEqual(["Physical", "Spiritual", "Mental", "Social"])
  })

  it("reports the raw week's scores when the range covers one week", () => {
    expect(getSharpenData(DEFAULT_FROM, DEFAULT_TO).map(x => x.score)).toEqual([78, 45, 85, 62])
  })

  it("averages across a multi-week range", () => {
    // w1 + w2 physical = (78 + 65) / 2 = 71.5 → 72
    expect(getSharpenData(d(19, 4), d(1, 5))[0].score).toBe(72)
  })

  it("zeroes every dimension when no week matches", () => {
    const data = getSharpenData(d(1, 0, 2020), d(2, 0, 2020))
    expect(data.every(x => x.score === 0)).toBe(true)
  })
})

describe("getRoleStats", () => {
  it("sums completed and total across the range", () => {
    const single = getRoleStats(DEFAULT_FROM, DEFAULT_TO)
    expect(single[0]).toMatchObject({ role: "Programmer", completed: 16, total: 20 })

    // w1 + w2 programmer = 16+12 completed, 20+18 total
    const twoWeeks = getRoleStats(d(19, 4), d(1, 5))
    expect(twoWeeks[0]).toMatchObject({ completed: 28, total: 38 })
  })

  it("never reports more completed than total", () => {
    for (const stat of getRoleStats(d(28, 3), d(1, 5))) {
      expect(stat.completed).toBeLessThanOrEqual(stat.total)
    }
  })

  it("zeroes every role when no week matches", () => {
    expect(getRoleStats(d(1, 0, 2020), d(2, 0, 2020)).every(s => s.total === 0)).toBe(true)
  })
})

describe("getDailyPriority / getWeekLabel", () => {
  it("returns seven days for a date inside a known week", () => {
    const days = getDailyPriority(d(26, 4))
    expect(days.map(x => x.day)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
  })

  it("returns nothing for a date outside the registry", () => {
    expect(getDailyPriority(d(1, 0, 2020))).toEqual([])
  })

  it("labels the matched week and says so when there is none", () => {
    expect(getWeekLabel(d(26, 4))).toBe(WEEK_REGISTRY[0].label)
    expect(getWeekLabel(d(1, 0, 2020))).toBe("No matching week")
  })
})
