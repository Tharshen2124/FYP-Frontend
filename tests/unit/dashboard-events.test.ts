import { describe, it, expect } from "vitest"
import { linkLabel, toCalEvents } from "@/app/dashboard/_utils/events"
import type { ApiTask } from "@/app/dashboard/_types"

/**
 * The backend sends the parts of a task's link rather than a finished sentence, because the
 * display names for the renewal dimensions ("Social / Emotional", not "social") only exist in the
 * frontend. These tests pin that composition and the colour rules the timetable draws with.
 */

function task(overrides: Partial<ApiTask> = {}): ApiTask {
  return {
    task_id: 1,
    title: "Deep work",
    description: null,
    day_of_week: 0,
    start_time: "09:00",
    end_time: "10:30",
    is_fixed_appointment: false,
    is_daily_priority: false,
    is_completed: false,
    link_kind: null,
    link_text: null,
    role_name: null,
    dimension: null,
    ...overrides,
  }
}

describe("linkLabel", () => {
  it("names a goal by its role", () => {
    expect(linkLabel(task({ link_kind: "goal", link_text: "Ship the FYP", role_name: "Professional" })))
      .toBe("Professional — Ship the FYP")
  })

  it("names an activity by its dimension's display label, not the raw id", () => {
    expect(linkLabel(task({ link_kind: "activity", link_text: "Call a friend", dimension: "social" })))
      .toBe("Social / Emotional — Call a friend")
  })

  it("falls back to the bare text when the dimension is unrecognised", () => {
    expect(linkLabel(task({ link_kind: "activity", link_text: "Something", dimension: "nonsense" })))
      .toBe("Something")
  })

  it("has no label for a fixed appointment", () => {
    expect(linkLabel(task({ is_fixed_appointment: true }))).toBeUndefined()
  })
})

describe("toCalEvents", () => {
  it("converts clock times into minutes past midnight", () => {
    const [event] = toCalEvents([task({ start_time: "09:00", end_time: "10:30" })])
    expect(event.startMins).toBe(540)
    expect(event.endMins).toBe(630)
  })

  it("keeps day_of_week as the Monday-indexed column", () => {
    const [event] = toCalEvents([task({ day_of_week: 6 })])
    expect(event.dayIndex).toBe(6)
  })

  it("colours fixed appointments blue and flags them", () => {
    const [event] = toCalEvents([task({ is_fixed_appointment: true })])
    expect(event.color).toBe("#3b82f6")
    expect(event.isFixed).toBe(true)
  })

  it("colours a daily priority differently from an ordinary task", () => {
    const [priority] = toCalEvents([task({ is_daily_priority: true })])
    const [ordinary] = toCalEvents([task()])
    expect(priority.color).toBe("#FFCC00")
    expect(ordinary.color).toBe("#B13BFF")
    expect(priority.color).not.toBe(ordinary.color)
  })

  it("a fixed appointment stays blue even if daily priority were somehow set", () => {
    const [event] = toCalEvents([task({ is_fixed_appointment: true, is_daily_priority: true })])
    expect(event.color).toBe("#3b82f6")
  })

  it("uses the task id as a stable string key", () => {
    const [event] = toCalEvents([task({ task_id: 42 })])
    expect(event.id).toBe("42")
  })
})
