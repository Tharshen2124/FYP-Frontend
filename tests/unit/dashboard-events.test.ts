import { describe, it, expect } from "vitest"
import { linkLabel, taskDetail, toCalEvents } from "@/app/dashboard/_utils/events"
import { fmtDuration } from "@/app/dashboard/_utils/time"
import type { ApiTask } from "@/app/dashboard/_types"

/**
 * The backend sends the parts of a task's link rather than a finished sentence, because the
 * display names for the Sharpen the Saw dimensions ("Social / Emotional", not "social") only exist in the
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

/**
 * The detail dialog reads the `ApiTask` rather than the `CalEvent` the grid draws, because
 * `toCalEvents` throws most of a task away on purpose — a card has room for a title and a time.
 * These pin which facts survive into the dialog, and which are dropped rather than shown empty.
 */
describe("taskDetail", () => {
  it("names a goal task by its goal and its role", () => {
    const { kind, rows } = taskDetail(
      task({ link_kind: "goal", link_text: "Ship the FYP", role_name: "Professional" })
    )
    expect(kind).toBe("Role goal")
    expect(rows).toEqual([
      { label: "Goal", value: "Ship the FYP" },
      { label: "Role", value: "Professional" },
    ])
  })

  it("names an activity by its dimension's display label, not the raw id", () => {
    const { kind, rows } = taskDetail(
      task({ link_kind: "activity", link_text: "Call a friend", dimension: "social" })
    )
    expect(kind).toBe("Sharpen the Saw")
    expect(rows).toEqual([
      { label: "Activity", value: "Call a friend" },
      { label: "Dimension", value: "Social / Emotional" },
    ])
  })

  /* Unlike `linkLabel`, which drops an unrecognised dimension entirely: under a "Dimension" label
     the raw word still tells the reader something. */
  it("shows an unrecognised dimension as it came", () => {
    const { rows } = taskDetail(
      task({ link_kind: "activity", link_text: "Something", dimension: "nonsense" })
    )
    expect(rows).toContainEqual({ label: "Dimension", value: "nonsense" })
  })

  it("gives a fixed appointment its notes and no link rows", () => {
    const { kind, rows } = taskDetail(
      task({ is_fixed_appointment: true, description: "Room 4.02" })
    )
    expect(kind).toBe("Fixed appointment")
    expect(rows).toEqual([{ label: "Notes", value: "Room 4.02" }])
  })

  /* A row is dropped rather than shown empty — "Goal: —" only invites the reader to wonder which
     one went missing. */
  it("has no rows at all for a task linked to nothing", () => {
    expect(taskDetail(task()).rows).toEqual([])
    expect(taskDetail(task()).kind).toBe("Task")
  })

  it("ignores a description that is only whitespace", () => {
    expect(taskDetail(task({ description: "   " })).rows).toEqual([])
  })

  it("carries the same colour the card is drawn in", () => {
    expect(taskDetail(task()).color).toBe("#B13BFF")
    expect(taskDetail(task({ is_daily_priority: true })).color).toBe("#FFCC00")
    expect(taskDetail(task({ is_fixed_appointment: true, is_daily_priority: true })).color)
      .toBe("#3b82f6")
  })
})

describe("fmtDuration", () => {
  it("drops the hours when there are none", () => {
    expect(fmtDuration(45)).toBe("45m")
    expect(fmtDuration(30)).toBe("30m")
  })

  it("drops the minutes when the span is whole hours", () => {
    expect(fmtDuration(60)).toBe("1h")
    expect(fmtDuration(120)).toBe("2h")
  })

  it("gives both parts otherwise", () => {
    expect(fmtDuration(90)).toBe("1h 30m")
    expect(fmtDuration(185)).toBe("3h 5m")
  })
})
