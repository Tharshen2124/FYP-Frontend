import { describe, it, expect } from "vitest"
import {
  minsToStr,
  strToMins,
  fmtTime,
  snapMins,
} from "@/app/onboarding/fixed-appointments/_utils/time"
import {
  getOverlaps,
  getPositionStyle,
} from "@/app/onboarding/fixed-appointments/_utils/calendar"
import type { CalItem } from "@/app/onboarding/fixed-appointments/_types"

describe("time helpers", () => {
  it("round-trips minutes through the HH:MM input format", () => {
    expect(minsToStr(0)).toBe("00:00")
    expect(minsToStr(9 * 60 + 5)).toBe("09:05")
    expect(minsToStr(22 * 60)).toBe("22:00")
    expect(strToMins("09:05")).toBe(545)
    expect(strToMins(minsToStr(837))).toBe(837)
  })

  it("treats a bare hour as :00", () => {
    expect(strToMins("07")).toBe(420)
  })

  it("formats a 12-hour clock label", () => {
    expect(fmtTime(0)).toBe("12:00 AM")
    expect(fmtTime(9 * 60 + 30)).toBe("9:30 AM")
    expect(fmtTime(12 * 60)).toBe("12:00 PM")
    expect(fmtTime(13 * 60 + 5)).toBe("1:05 PM")
  })

  it("snaps to the nearest quarter hour", () => {
    expect(snapMins(0)).toBe(0)
    expect(snapMins(7)).toBe(0)
    expect(snapMins(8)).toBe(15)
    expect(snapMins(544)).toBe(540)
  })
})

const item = (id: string, dayIndex: number, startMins: number, endMins: number): CalItem =>
  ({ id, dayIndex, startMins, endMins })

describe("getOverlaps", () => {
  const nine = item("a", 0, 540, 600)   // Mon 09:00–10:00
  const half = item("b", 0, 570, 630)   // Mon 09:30–10:30
  const later = item("c", 0, 600, 660)  // Mon 10:00–11:00
  const tuesday = item("d", 1, 540, 600)
  const all = [nine, half, later, tuesday]

  it("finds items whose ranges intersect on the same day", () => {
    expect(getOverlaps(all, 0, 540, 600, "a").map(i => i.id)).toEqual(["b"])
  })

  it("treats touching edges as non-overlapping", () => {
    expect(getOverlaps([nine, later], 0, 600, 660, "c")).toEqual([])
  })

  it("ignores other days", () => {
    expect(getOverlaps(all, 1, 540, 600, "d")).toEqual([])
  })

  it("always excludes the item being moved", () => {
    expect(getOverlaps(all, 0, 540, 600, "a").some(i => i.id === "a")).toBe(false)
  })

  it("reports every clash so the caller can warn on 1 and block on 2+", () => {
    const crowded = [nine, half, item("e", 0, 550, 560)]
    expect(getOverlaps(crowded, 0, 545, 620, "x")).toHaveLength(3)
  })
})

describe("getPositionStyle", () => {
  it("uses the full column when nothing overlaps", () => {
    const solo = item("a", 0, 540, 600)
    expect(getPositionStyle(solo, [solo])).toEqual({ left: "2px", right: "2px", width: "auto" })
  })

  it("splits the column 50/50 with the earlier event on the left", () => {
    const first = item("a", 0, 540, 620)
    const second = item("b", 0, 570, 630)
    const all = [first, second]

    expect(getPositionStyle(first, all).left).toBe("2px")
    expect(getPositionStyle(second, all).left).toBe("calc(50% + 1px)")
    expect(getPositionStyle(first, all).width).toBe("calc(50% - 3px)")
  })

  it("breaks start-time ties by id so column assignment is stable", () => {
    const a = item("a", 0, 540, 600)
    const b = item("b", 0, 540, 600)
    expect(getPositionStyle(a, [b, a]).left).toBe("2px")
    expect(getPositionStyle(b, [b, a]).left).toBe("calc(50% + 1px)")
  })
})
