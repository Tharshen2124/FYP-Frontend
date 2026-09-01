import { describe, it, expect } from "vitest"
import { eventCategories, linkLabel, paintedColor, taskDetail, toCalEvents } from "@/app/dashboard/_utils/events"
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
    day_of_week: 0,
    start_time: "09:00",
    end_time: "10:30",
    is_fixed_appointment: false,
    is_daily_priority: false,
    is_weekly_priority: false,
    is_completed: false,
    link_kind: null,
    link_text: null,
    role_name: null,
    role_color_id: null,
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

  /* The dashboard used to paint every task one purple. It now tints by what the task serves, which
     is what makes a week's balance across roles legible at a glance — and what the palette on
     /roles is for. */
  it("tints a goal task in its role's colour and names the role", () => {
    const [event] = toCalEvents([
      task({ link_kind: "goal", role_name: "Professional", role_color_id: "teal" }),
    ])
    expect(event.color).toBe("#14b8a6")
    expect(event.categoryKind).toBe("goal")
    expect(event.categoryLabel).toBe("Professional")
  })

  it("tints a Sharpen the Saw task in its dimension's colour and names the dimension", () => {
    const [event] = toCalEvents([task({ link_kind: "activity", dimension: "physical" })])
    expect(event.color).toBe("#22c55e")
    expect(event.categoryKind).toBe("activity")
    expect(event.categoryLabel).toBe("Physical")
  })

  /* Roles predate the palette server-side, so a stored role may carry no colour at all. */
  it("falls back to the default role colour when the role carries none", () => {
    const [event] = toCalEvents([task({ link_kind: "goal", role_name: "Professional" })])
    expect(event.color).toBe("#B13BFF")
  })

  it("names a task linked to nothing rather than leaving it untinted", () => {
    const [event] = toCalEvents([task()])
    expect(event.categoryKind).toBe("none")
    expect(event.categoryLabel).toBe("Unlinked")
    expect(event.color).toBe("#94a3b8")
  })

  /* The split /history already makes: `color` stays the category's so the legend can go on naming
     the role, and the reserved yellow is applied over it at paint time. Folding the two would
     rename a weekly-priority task's role to "yellow" in the legend. */
  it("keeps a weekly priority's role colour and paints the reserved yellow over it", () => {
    const [event] = toCalEvents([
      task({ link_kind: "goal", role_name: "Professional", role_color_id: "teal", is_weekly_priority: true }),
    ])
    expect(event.color).toBe("#14b8a6")
    expect(paintedColor(event)).toBe("#FFCC00")
  })

  /* The rule the whole change turns on: a daily priority is a star, not a colour. Before, it took
     the yellow, so a card could not say which of the two it was. */
  it("leaves a daily priority the category colour and flags it instead", () => {
    const [event] = toCalEvents([
      task({ link_kind: "goal", role_name: "Professional", role_color_id: "teal", is_daily_priority: true }),
    ])
    expect(paintedColor(event)).toBe("#14b8a6")
    expect(event.isDailyPriority).toBe(true)
    expect(event.isWeeklyPriority).toBe(false)
  })

  it("keeps the yellow for a task that is both", () => {
    const [event] = toCalEvents([task({ is_weekly_priority: true, is_daily_priority: true })])
    expect(paintedColor(event)).toBe("#FFCC00")
    expect(event.isDailyPriority).toBe(true)
  })

  it("a fixed appointment stays blue whatever priority flags arrive with it", () => {
    const [event] = toCalEvents([
      task({ is_fixed_appointment: true, is_daily_priority: true, is_weekly_priority: true }),
    ])
    expect(paintedColor(event)).toBe("#3b82f6")
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

  it("gives a fixed appointment no link rows", () => {
    const { kind, rows } = taskDetail(task({ is_fixed_appointment: true }))
    expect(kind).toBe("Fixed appointment")
    expect(rows).toEqual([])
  })

  /* A row is dropped rather than shown empty — "Goal: —" only invites the reader to wonder which
     one went missing. */
  it("has no rows at all for a task linked to nothing", () => {
    expect(taskDetail(task()).rows).toEqual([])
    expect(taskDetail(task()).kind).toBe("Task")
  })

  it("carries the same colour the card is drawn in", () => {
    const goal = { link_kind: "goal", role_name: "Professional", role_color_id: "teal" } as const
    expect(taskDetail(task(goal)).color).toBe("#14b8a6")
    expect(taskDetail(task({ ...goal, is_weekly_priority: true })).color).toBe("#FFCC00")
    expect(taskDetail(task({ ...goal, is_daily_priority: true })).color).toBe("#14b8a6")
    expect(taskDetail(task({ is_fixed_appointment: true, is_weekly_priority: true })).color)
      .toBe("#3b82f6")
  })
})

/**
 * What the timetable's legend is built from. It lists the week's real roles and dimensions rather
 * than claiming every task is one purple — a claim that stopped being true the moment a card took
 * the colour of the role behind it.
 */
describe("eventCategories", () => {
  it("reports one entry per drawn block, for the legend to fold", () => {
    const events = toCalEvents([
      task({ task_id: 1, link_kind: "goal", role_name: "Professional", role_color_id: "teal" }),
      task({ task_id: 2, link_kind: "goal", role_name: "Professional", role_color_id: "teal" }),
      task({ task_id: 3, link_kind: "activity", dimension: "physical" }),
      task({ task_id: 4, is_fixed_appointment: true }),
    ])

    expect(eventCategories(events)).toEqual([
      { kind: "goal", label: "Professional", color: "#14b8a6" },
      { kind: "goal", label: "Professional", color: "#14b8a6" },
      { kind: "activity", label: "Physical", color: "#22c55e" },
      { kind: "fixed", label: "Fixed appointments", color: "#3b82f6" },
    ])
  })

  /* A weekly priority contributes its role, not the yellow: the yellow has its own legend row. */
  it("reports a weekly-priority task under its role, not under the reserved yellow", () => {
    const events = toCalEvents([
      task({ link_kind: "goal", role_name: "Parent", role_color_id: "rose", is_weekly_priority: true }),
    ])
    expect(eventCategories(events)).toEqual([{ kind: "goal", label: "Parent", color: "#f43f5e" }])
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
