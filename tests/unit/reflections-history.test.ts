import { describe, it, expect } from "vitest"
import {
  canGenerateSummary,
  countWritten,
  isEditableWeek,
  isPastWeek,
  toDaySlots,
  weekStartsBack,
} from "@/app/evening-reflections/_utils/weeks"
import { groupBy } from "@/app/history/_utils/group"
import { fmtTime } from "@/app/history/_utils/time"
import { getWeekStart } from "@/lib/date"

describe("weekStartsBack", () => {
  it("walks back a Monday at a time, most recent first", () => {
    expect(weekStartsBack("2026-08-17", 3)).toEqual(["2026-08-17", "2026-08-10", "2026-08-03"])
  })

  it("crosses a month and a year boundary", () => {
    expect(weekStartsBack("2026-01-04", 2)).toEqual(["2026-01-04", "2025-12-28"])
  })
})

describe("isPastWeek / isEditableWeek", () => {
  // Mon 17 Aug 2026 is the week under test; Mon 24 Aug is the week after.
  const thisWeek = "2026-08-17"

  it("is not past on any day of its own week, including the final Sunday", () => {
    expect(isPastWeek(thisWeek, new Date(2026, 7, 17))).toBe(false)
    expect(isPastWeek(thisWeek, new Date(2026, 7, 23, 23, 59))).toBe(false)
    expect(isEditableWeek(thisWeek, new Date(2026, 7, 23, 23, 59))).toBe(true)
  })

  it("becomes past the moment the next week starts", () => {
    expect(isPastWeek(thisWeek, new Date(2026, 7, 24))).toBe(true)
    expect(isEditableWeek(thisWeek, new Date(2026, 7, 24))).toBe(false)
  })

  it("a week that has not started yet is neither past nor editable", () => {
    expect(isPastWeek("2026-08-24", new Date(2026, 7, 19))).toBe(false)
    expect(isEditableWeek("2026-08-24", new Date(2026, 7, 19))).toBe(false)
  })
})

describe("toDaySlots", () => {
  const entry = (dayIndex: number) => ({ dayIndex, text: `day ${dayIndex}`, updatedAt: "" })

  it("always returns seven slots, filled by day index rather than by arrival order", () => {
    const slots = toDaySlots([entry(4), entry(0)])

    expect(slots).toHaveLength(7)
    expect(slots[0]?.text).toBe("day 0")
    expect(slots[4]?.text).toBe("day 4")
    // The bug this guards: pushing in order would have put Friday's entry at index 1.
    expect(slots[1]).toBeUndefined()
  })

  it("counts only the days actually written", () => {
    expect(countWritten(toDaySlots([]))).toBe(0)
    expect(countWritten(toDaySlots([entry(2), entry(6)]))).toBe(2)
  })
})

describe("canGenerateSummary", () => {
  const base = { planned: true, reflectionCount: 7, summary: null }

  it("needs all seven days and no existing summary", () => {
    expect(canGenerateSummary(base)).toBe(true)
    expect(canGenerateSummary({ ...base, reflectionCount: 6 })).toBe(false)
    expect(canGenerateSummary({ ...base, summary: { text: "done", generatedAt: "" } })).toBe(false)
  })

  it("needs a week that was actually planned, since a reflection hangs off the plan", () => {
    expect(canGenerateSummary({ ...base, planned: false })).toBe(false)
  })

  // Read-only applies to reflections, not to this: a week that closed with all seven written is
  // exactly the week most worth summarising.
  it("does not care whether the week has ended", () => {
    expect(canGenerateSummary(base)).toBe(true)
  })
})

describe("history helpers", () => {
  it("groups items by key, preserving order", () => {
    const items = [
      { role: "A", t: 1 },
      { role: "B", t: 2 },
      { role: "A", t: 3 },
    ]
    const grouped = groupBy(items, i => i.role)
    expect(Object.keys(grouped)).toEqual(["A", "B"])
    expect(grouped.A.map(i => i.t)).toEqual([1, 3])
  })

  it("returns an empty object for no items", () => {
    expect(groupBy([] as { k: string }[], i => i.k)).toEqual({})
  })

  it("formats compact clock labels, dropping :00", () => {
    expect(fmtTime(0)).toBe("12am")
    expect(fmtTime(9 * 60)).toBe("9am")
    expect(fmtTime(9 * 60 + 30)).toBe("9:30am")
    expect(fmtTime(12 * 60)).toBe("12pm")
    expect(fmtTime(13 * 60 + 5)).toBe("1:05pm")
  })
})

describe("getWeekStart (shared, lib/date)", () => {
  it("returns the Monday of the containing week at midnight", () => {
    const wed = getWeekStart(new Date(2026, 4, 20, 15, 30))
    expect(wed.getDay()).toBe(1)
    expect(wed.getDate()).toBe(18)
    expect([wed.getHours(), wed.getMinutes(), wed.getSeconds()]).toEqual([0, 0, 0])
  })

  it("treats Sunday as the end of the week, not the start", () => {
    expect(getWeekStart(new Date(2026, 4, 24)).getDate()).toBe(18)
  })

  it("is idempotent on a Monday", () => {
    const mon = new Date(2026, 4, 18)
    expect(getWeekStart(getWeekStart(mon)).getTime()).toBe(getWeekStart(mon).getTime())
  })

  it("does not mutate its argument", () => {
    const input = new Date(2026, 4, 20, 15, 30)
    const copy = new Date(input)
    getWeekStart(input)
    expect(input.getTime()).toBe(copy.getTime())
  })
})
