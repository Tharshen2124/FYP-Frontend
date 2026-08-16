import { describe, it, expect } from "vitest"
import { generateWeeks, hasAnyReflection } from "@/app/evening-reflections/_utils/weeks"
import { INITIAL_WEEKS } from "@/app/evening-reflections/_constants/reflections"
import { groupBy } from "@/app/history/_utils/group"
import { fmtTime } from "@/app/history/_utils/time"
import { getWeekStart } from "@/lib/date"

describe("generateWeeks", () => {
  it("produces the requested number of weeks, most recent first", () => {
    const weeks = generateWeeks(new Date(2026, 4, 24), 8)
    expect(weeks).toHaveLength(8)
    expect(weeks[0].id).toBe("week-0")
    expect(weeks[0].label).toBe("18 May – 24 May")
    expect(weeks[1].label).toBe("11 May – 17 May")
  })

  it("anchors on Monday, including when the reference day is a Sunday", () => {
    // 24 May 2026 is a Sunday → its week starts Monday 18 May
    expect(generateWeeks(new Date(2026, 4, 24), 1)[0].label.startsWith("18 May")).toBe(true)
    // 20 May 2026 is a Wednesday → same week
    expect(generateWeeks(new Date(2026, 4, 20), 1)[0].label.startsWith("18 May")).toBe(true)
  })

  it("spans a month boundary in the label", () => {
    expect(generateWeeks(new Date(2026, 5, 3), 1)[0].label).toBe("1 Jun – 7 Jun")
  })

  it("seeds the page with eight empty weeks", () => {
    expect(INITIAL_WEEKS).toHaveLength(8)
    expect(INITIAL_WEEKS.every(w => !hasAnyReflection(w) && w.summary === "")).toBe(true)
  })
})

describe("hasAnyReflection", () => {
  const base = { id: "w", label: "l", summary: "" }

  it("is false with no entries and with only blank entries", () => {
    expect(hasAnyReflection({ ...base, reflections: {} })).toBe(false)
    expect(hasAnyReflection({ ...base, reflections: { Monday: { text: "" } } })).toBe(false)
  })

  it("is true as soon as one day has text", () => {
    expect(hasAnyReflection({ ...base, reflections: { Monday: { text: "ok" } } })).toBe(true)
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
