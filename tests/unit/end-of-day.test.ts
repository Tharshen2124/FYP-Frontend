import { describe, it, expect } from "vitest"
import { isCheckInDue } from "@/app/dashboard/_utils/eod"

/**
 * The clock half of the check-in's trigger. The other half — whether tonight has already been
 * dealt with — is a `check_ins` row on the weekly-plan response, not something this decides.
 *
 * The time arrives from the API and can still be absent or malformed, so these pin what the page
 * does with each.
 */

/** A fixed local evening, so the assertions do not move with the clock. */
const at = (hours: number, mins: number) => new Date(2026, 7, 22, hours, mins)

describe("isCheckInDue", () => {
  it("is due once the configured time has passed", () => {
    expect(isCheckInDue(at(21, 30), "21:00")).toBe(true)
  })

  it("is not due before it", () => {
    expect(isCheckInDue(at(20, 59), "21:00")).toBe(false)
  })

  it("is due on the minute", () => {
    expect(isCheckInDue(at(21, 0), "21:00")).toBe(true)
  })

  it("honours a time the user moved earlier", () => {
    expect(isCheckInDue(at(18, 5), "18:00")).toBe(true)
  })

  /* The server always sends one, so this is the gap before the first response lands rather than a
     user who has no time set. */
  it("falls back to 21:00 when no time has arrived yet", () => {
    expect(isCheckInDue(at(20, 30), null)).toBe(false)
    expect(isCheckInDue(at(21, 30), null)).toBe(true)
  })

  /* A malformed value should never prompt at an hour nobody chose, so it falls back to the default
     rather than to midnight. */
  it("ignores a time that is not a time of day", () => {
    expect(isCheckInDue(at(20, 30), "not-a-time")).toBe(false)
    expect(isCheckInDue(at(20, 30), "25:00")).toBe(false)
    expect(isCheckInDue(at(20, 30), "")).toBe(false)
    expect(isCheckInDue(at(21, 30), "not-a-time")).toBe(true)
  })
})
