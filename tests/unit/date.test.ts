import { describe, it, expect, afterAll } from "vitest"
import { localDateParam, localWeekStartParam } from "@/lib/date"

/**
 * These tests pin the two cases where `toISOString().slice(0, 10)` disagrees with the
 * user's local calendar date — the failure API_CONTRACT.md §0 forbids. `localDateParam`
 * is unbackstopped for the bare `date` params (§8.1, §12.4): a ±1 day error there is
 * indistinguishable from a legitimate timezone offset, so the server cannot reject it.
 *
 * Node reads `process.env.TZ` per call, so each case sets its own zone.
 */

const ORIGINAL_TZ = process.env.TZ
afterAll(() => { process.env.TZ = ORIGINAL_TZ })

function at(tz: string, iso: string) {
  process.env.TZ = tz
  return new Date(iso)
}

describe("localDateParam", () => {
  it("east of UTC just after local midnight — toISOString would send yesterday", () => {
    // Asia/Singapore is UTC+8. 16:30Z is 00:30 local on the FOLLOWING day.
    const d = at("Asia/Singapore", "2026-08-13T16:30:00Z")

    expect(localDateParam(d)).toBe("2026-08-14")
    expect(d.toISOString().slice(0, 10)).toBe("2026-08-13") // the bug, one day behind
  })

  it("west of UTC late in the evening — toISOString would send tomorrow", () => {
    // America/New_York is UTC-4 in August. 03:30Z is 23:30 local on the PREVIOUS day.
    const d = at("America/New_York", "2026-08-15T03:30:00Z")

    expect(localDateParam(d)).toBe("2026-08-14")
    expect(d.toISOString().slice(0, 10)).toBe("2026-08-15") // the bug, one day ahead
  })

  it("agrees with toISOString when the local date happens to match UTC", () => {
    const d = at("UTC", "2026-08-14T12:00:00Z")

    expect(localDateParam(d)).toBe("2026-08-14")
    expect(localDateParam(d)).toBe(d.toISOString().slice(0, 10))
  })

  it("zero-pads single-digit months and days", () => {
    const d = at("UTC", "2026-01-05T12:00:00Z")
    expect(localDateParam(d)).toBe("2026-01-05")
  })

  it("always returns exactly YYYY-MM-DD", () => {
    for (const tz of ["UTC", "Asia/Singapore", "America/New_York", "Pacific/Kiritimati"]) {
      const d = at(tz, "2026-08-13T16:30:00Z")
      expect(localDateParam(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it("holds at the extremes of the 26-hour offset span", () => {
    // Pacific/Kiritimati is UTC+14, Etc/GMT+12 is UTC-12 — the widest real spread.
    expect(localDateParam(at("Pacific/Kiritimati", "2026-08-13T11:00:00Z"))).toBe("2026-08-14")
    expect(localDateParam(at("Etc/GMT+12", "2026-08-14T11:00:00Z"))).toBe("2026-08-13")
  })

  it("defaults to now when called with no argument", () => {
    process.env.TZ = "UTC"
    const now = new Date()
    expect(localDateParam()).toBe(localDateParam(now))
  })
})

/**
 * `weekStart` is the value eight endpoints now take (API_CONTRACT.md §2.6, §6.1–6.5, §7.1),
 * because the server refuses to derive "the current week" from UTC. These tests pin the two
 * windows where a UTC-derived Monday addresses the WRONG week — the failure that made §6.2,
 * a full replacement of the goal selection, a destructive write against a neighbouring week.
 */
describe("localWeekStartParam", () => {
  it("east of UTC, early local Monday — UTC would still say Sunday and return last week", () => {
    // Asia/Singapore UTC+8. Mon 10 Aug 2026 02:00 local = Sun 9 Aug 18:00 UTC.
    const d = at("Asia/Singapore", "2026-08-09T18:00:00Z")

    expect(d.getDay()).toBe(1)                        // local: Monday
    expect(d.getUTCDay()).toBe(0)                     // UTC:   still Sunday
    expect(localWeekStartParam(d)).toBe("2026-08-10") // this week
    // A UTC-derived Monday would have produced 2026-08-03 — last week.
  })

  it("west of UTC, late local Sunday — UTC would already say Monday and return next week", () => {
    // America/New_York UTC-4 in August. Sun 9 Aug 2026 22:00 local = Mon 10 Aug 02:00 UTC.
    const d = at("America/New_York", "2026-08-10T02:00:00Z")

    expect(d.getDay()).toBe(0)                        // local: Sunday
    expect(d.getUTCDay()).toBe(1)                     // UTC:   already Monday
    expect(localWeekStartParam(d)).toBe("2026-08-03") // the week that is ending
    // A UTC-derived Monday would have produced 2026-08-10 — next week.
  })

  it("always lands on a Monday, which is what the server validates (422 otherwise)", () => {
    const zones = ["UTC", "Asia/Singapore", "America/New_York", "Pacific/Kiritimati", "Etc/GMT+12"]
    const instants = [
      "2026-08-09T18:00:00Z", "2026-08-10T02:00:00Z", "2026-08-12T11:00:00Z",
      "2026-08-15T23:59:00Z", "2026-08-16T00:01:00Z",
    ]
    for (const tz of zones) {
      for (const iso of instants) {
        const ws = localWeekStartParam(at(tz, iso))
        // Parse back as a local date and confirm it is a Monday.
        const [y, m, day] = ws.split("-").map(Number)
        expect(new Date(y, m - 1, day).getDay()).toBe(1)
      }
    }
  })

  it("is stable across a whole local week — every day maps to the same Monday", () => {
    process.env.TZ = "Asia/Singapore"
    const mondayLocalMidnight = new Date(2026, 7, 10) // Mon 10 Aug 2026, local
    const seen = new Set<string>()
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayLocalMidnight)
      d.setDate(d.getDate() + i)
      d.setHours(13, 45, 0, 0)
      seen.add(localWeekStartParam(d))
    }
    expect([...seen]).toEqual(["2026-08-10"])
  })
})
