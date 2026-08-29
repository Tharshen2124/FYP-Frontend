import { describe, it, expect } from "vitest"
import type { ApiHistoryActivity, ApiHistoryGoal, ApiHistoryTask } from "@/lib/api"
import {
  completionPercent,
  freeHistoryFloor,
  goalOutcome,
  ordinal,
  toHistoryActivity,
  toHistoryEvent,
  toHistoryGoal,
  outcomeLegend,
  weekLegend,
  weekStats,
} from "@/app/history/_utils/history"
import { strToMins } from "@/app/history/_utils/time"
import { weekStartsBack } from "@/lib/date"
import { FREE_TIER_LIMITS } from "@/lib/plans"
import type { HistoryWeek, LegendGroup } from "@/app/history/_types"

const task = (over: Partial<ApiHistoryTask> = {}): ApiHistoryTask => ({
  task_id: 1,
  title: "Draft chapter 3",
  description: null,
  day_of_week: 1,
  start_time: "14:00",
  end_time: "15:30",
  is_fixed_appointment: false,
  is_daily_priority: false,
  is_weekly_priority: false,
  is_completed: false,
  link_kind: "goal",
  link_text: "Ship the FYP",
  role_name: "Programmer",
  role_color_id: "primary",
  dimension: null,
  ...over,
})

const goal = (over: Partial<ApiHistoryGoal> = {}): ApiHistoryGoal => ({
  goal_id: 1,
  text: "Ship the FYP",
  is_weekly_priority: false,
  is_achieved: false,
  is_dropped: false,
  week_index: 1,
  is_carried_forward: false,
  role: { role_id: 1, name: "Programmer", color_id: "primary", icon_id: "code", is_archived: false },
  ...over,
})

describe("strToMins", () => {
  it("reads the HH:MM the API sends", () => {
    expect(strToMins("00:00")).toBe(0)
    expect(strToMins("09:30")).toBe(570)
    expect(strToMins("14:00")).toBe(840)
    expect(strToMins("23:59")).toBe(1439)
  })
})

describe("goalOutcome", () => {
  it("reports a dropped goal as dropped, even when its tasks were all done first", () => {
    // Reported apart from a miss so pruning neither reads as a failure nor raises the percentage.
    expect(goalOutcome({ isDropped: true, isAchieved: true, weekHasEnded: true })).toBe("dropped")
    expect(goalOutcome({ isDropped: true, isAchieved: false, weekHasEnded: true })).toBe("dropped")
  })

  it("is a miss only once the week has ended", () => {
    expect(goalOutcome({ isDropped: false, isAchieved: false, weekHasEnded: true })).toBe("missed")
    expect(goalOutcome({ isDropped: false, isAchieved: false, weekHasEnded: false })).toBe("open")
  })

  it("is achieved regardless of whether the week has ended", () => {
    expect(goalOutcome({ isDropped: false, isAchieved: true, weekHasEnded: true })).toBe("achieved")
    expect(goalOutcome({ isDropped: false, isAchieved: true, weekHasEnded: false })).toBe("achieved")
  })

  // Carrying forward is a fact about the *next* week and says nothing about how this one went, so
  // it is not an input here at all. The goals card draws it as a badge beside these.
  it("is decided without reference to whether the goal was carried forward", () => {
    const carriedAndUnfinished = toHistoryGoal(goal({ is_carried_forward: true }), true)
    expect(carriedAndUnfinished.outcome).toBe("missed")
    expect(carriedAndUnfinished.isCarriedForward).toBe(true)

    const carriedAndDone = toHistoryGoal(goal({ is_carried_forward: true, is_achieved: true }), true)
    expect(carriedAndDone.outcome).toBe("achieved")
    expect(carriedAndDone.isCarriedForward).toBe(true)
  })
})

describe("toHistoryGoal", () => {
  it("resolves the role colour from the id the backend stores", () => {
    expect(toHistoryGoal(goal(), true).roleColor).toBe("#B13BFF")
    expect(toHistoryGoal(goal({ role: { ...goal().role, color_id: "teal" } }), true).roleColor).toBe("#14b8a6")
  })

  it("keeps a goal whose role has since been archived", () => {
    const archived = goal({ role: { ...goal().role, is_archived: true } })
    expect(toHistoryGoal(archived, true).roleArchived).toBe(true)
  })

  it("falls back to the default colour when the role has no colour id", () => {
    expect(toHistoryGoal(goal({ role: { ...goal().role, color_id: null } }), true).roleColor).toBe("#B13BFF")
  })
})

describe("toHistoryActivity", () => {
  const activity = (over: Partial<ApiHistoryActivity> = {}): ApiHistoryActivity => ({
    sharpen_the_saw_activity_id: 1,
    dimension: "social",
    activity_description: "Call home on Sundays",
    is_deleted: false,
    ...over,
  })

  it("resolves the display label the frontend owns, not the stored string", () => {
    const resolved = toHistoryActivity(activity())
    expect(resolved.dimensionLabel).toBe("Social / Emotional")
    /* Rose, not the yellow it used to be: that colour is reserved for a weekly-priority task, so
       a Social / Emotional chip may not also claim it. */
    expect(resolved.dimensionColor).toBe("#f43f5e")
  })

  it("flags an activity deleted since rather than dropping it", () => {
    expect(toHistoryActivity(activity({ is_deleted: true })).isDeleted).toBe(true)
  })

  it("falls back to the raw dimension if it is not one of the four", () => {
    expect(toHistoryActivity(activity({ dimension: "nonsense" })).dimensionLabel).toBe("nonsense")
  })
})

describe("toHistoryEvent", () => {
  it("captions a goal-linked task with its role, in the role's colour", () => {
    const event = toHistoryEvent(task())
    expect(event.categoryKind).toBe("goal")
    expect(event.categoryLabel).toBe("Programmer")
    expect(event.color).toBe("#B13BFF")
  })

  it("captions an activity-linked task with its dimension's display label", () => {
    const event = toHistoryEvent(
      task({ link_kind: "activity", role_name: null, role_color_id: null, dimension: "physical" })
    )
    expect(event.categoryKind).toBe("activity")
    expect(event.categoryLabel).toBe("Physical")
    expect(event.color).toBe("#f97316")
  })

  it("captions a fixed appointment, which carries no link at all", () => {
    const event = toHistoryEvent(
      task({ is_fixed_appointment: true, link_kind: null, link_text: null, role_name: null, role_color_id: null })
    )
    expect(event.categoryKind).toBe("fixed")
    expect(event.categoryLabel).toBe("Fixed")
    expect(event.color).toBe("#3b82f6")
    expect(event.isFixed).toBe(true)
  })

  it("names an unlinked task rather than rendering an untinted chip", () => {
    // The planning UI cannot create one, but the schema permits it.
    const event = toHistoryEvent(task({ link_kind: null, link_text: null, role_name: null, role_color_id: null }))
    expect(event.categoryKind).toBe("none")
    expect(event.categoryLabel).toBe("Unlinked")
  })

  it("converts the API's HH:MM times into the minutes the grid sorts on", () => {
    const event = toHistoryEvent(task())
    expect([event.startMins, event.endMins]).toEqual([840, 930])
  })

  it("carries completion through, which nothing could write before", () => {
    expect(toHistoryEvent(task({ is_completed: true })).isCompleted).toBe(true)
    expect(toHistoryEvent(task()).isCompleted).toBe(false)
  })
})

describe("ordinal", () => {
  it("suffixes the ordinary cases", () => {
    expect([1, 2, 3, 4, 21, 22, 23].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "21st", "22nd", "23rd"])
  })

  it("gets the teens right, which a last-digit rule does not", () => {
    expect([11, 12, 13, 111, 112, 113].map(ordinal)).toEqual(["11th", "12th", "13th", "111th", "112th", "113th"])
  })
})

describe("toHistoryGoal lineage", () => {
  it("carries how many weeks the goal has run, and whether it went on", () => {
    const carried = toHistoryGoal(goal({ week_index: 3, is_carried_forward: true }), true)
    expect(carried.weekIndex).toBe(3)
    expect(carried.isCarriedForward).toBe(true)
    // Where it came from and where it went, both reported alongside the outcome rather than as one.
    expect(carried.outcome).toBe("missed")
  })

  it("treats a goal begun in the week as its first, pointing nowhere", () => {
    const fresh = toHistoryGoal(goal(), true)
    expect(fresh.weekIndex).toBe(1)
    expect(fresh.outcome).toBe("missed")
  })
})

describe("weekLegend", () => {
  const labelsIn = (groups: LegendGroup[], key: string) =>
    groups.find(g => g.key === key)?.entries.map(e => e.label) ?? []

  const fixedTask = (over: Partial<ApiHistoryTask> = {}) =>
    task({ is_fixed_appointment: true, link_kind: null, role_name: null, role_color_id: null, ...over })

  const stsTask = (over: Partial<ApiHistoryTask> = {}) =>
    task({ link_kind: "activity", role_name: null, role_color_id: null, dimension: "physical", ...over })

  it("lists each category once, however many tasks share it", () => {
    const events = [
      toHistoryEvent(task({ task_id: 1 })),
      toHistoryEvent(task({ task_id: 2, title: "Write up" })),
    ]
    expect(labelsIn(weekLegend(events), "goal")).toEqual(["Programmer"])
  })

  it("separates two roles that happen to share a colour", () => {
    const events = [
      toHistoryEvent(task({ task_id: 1, role_name: "Programmer" })),
      toHistoryEvent(task({ task_id: 2, role_name: "Parent" })),
    ]
    expect(labelsIn(weekLegend(events), "goal")).toEqual(["Programmer", "Parent"])
  })

  it("keeps role names and dimension labels in rows of their own", () => {
    // The whole point of the split: "Parent" and "Physical" are indistinguishable on a flat line.
    const legend = weekLegend([
      toHistoryEvent(task({ task_id: 1, role_name: "Parent" })),
      toHistoryEvent(stsTask({ task_id: 2 })),
    ])
    expect(legend.map(g => g.key)).toEqual(["goal", "activity"])
    expect(labelsIn(legend, "goal")).toEqual(["Parent"])
    expect(labelsIn(legend, "activity")).toEqual(["Physical"])
  })

  it("puts fixed appointments last, under the row for what belongs to neither", () => {
    const legend = weekLegend([
      toHistoryEvent(fixedTask({ task_id: 1 })),
      toHistoryEvent(task({ task_id: 2 })),
      toHistoryEvent(stsTask({ task_id: 3 })),
    ])
    expect(legend.map(g => g.key)).toEqual(["goal", "activity", "other"])
    expect(labelsIn(legend, "other")).toEqual(["Fixed"])
  })

  it("leaves out a row the week put nothing in", () => {
    const legend = weekLegend([toHistoryEvent(fixedTask({ task_id: 1 }))])
    expect(legend.map(g => g.key)).toEqual(["other"])
  })

  it("is empty for a week with nothing scheduled", () => {
    expect(weekLegend([])).toEqual([])
  })
})

describe("outcomeLegend", () => {
  const goals = (...overs: Partial<ApiHistoryGoal>[]) =>
    overs.map((over, i) => toHistoryGoal(goal({ goal_id: i + 1, ...over }), true))

  it("explains only the markers the week actually used", () => {
    expect(outcomeLegend(goals({ is_achieved: true }))).toEqual(["achieved"])
  })

  it("orders them as the card reads: met, missed, then what left the week", () => {
    // Independent of the order the goals arrive in, so two weeks' legends are directly comparable.
    const week = goals({ is_dropped: true }, {}, { is_achieved: true })
    expect(outcomeLegend(week)).toEqual(["achieved", "missed", "dropped"])
  })

  // The arrow is not one of these -- it is a badge the card decides on separately, so a carried
  // goal contributes only the outcome it actually earned.
  it("does not treat a carried goal as a marker of its own", () => {
    expect(outcomeLegend(goals({ is_carried_forward: true }))).toEqual(["missed"])
  })

  it("is empty for a week with no goals, so no rule is drawn under nothing", () => {
    expect(outcomeLegend([])).toEqual([])
  })
})

describe("weekStats", () => {
  const week = (): HistoryWeek => ({
    weekStart: "2026-08-10",
    goals: [
      toHistoryGoal(goal({ goal_id: 1, is_achieved: true }), true),
      toHistoryGoal(goal({ goal_id: 2 }), true),
      toHistoryGoal(goal({ goal_id: 3, is_dropped: true }), true),
    ],
    activities: [toHistoryActivity({
      sharpen_the_saw_activity_id: 1, dimension: "physical",
      activity_description: "Swim", is_deleted: false,
    })],
    events: [
      toHistoryEvent(task({ task_id: 1, is_completed: true })),
      toHistoryEvent(task({ task_id: 2 })),
      toHistoryEvent(
        task({ task_id: 3, is_fixed_appointment: true, is_completed: true, link_kind: null, role_name: null, role_color_id: null })
      ),
    ],
  })

  it("leaves a dropped goal out of both halves of the ratio", () => {
    // Otherwise pruning a goal would move the score, in one direction or the other.
    const stats = weekStats(week())
    expect(stats.goalCount).toBe(2)
    expect(stats.goalsAchieved).toBe(1)
  })

  it("keeps a carried goal in the denominator, since it was not achieved this week", () => {
    const carried = { ...week(), goals: [
      toHistoryGoal(goal({ goal_id: 1, is_achieved: true }), true),
      toHistoryGoal(goal({ goal_id: 2, is_carried_forward: true }), true),
    ] }
    expect(weekStats(carried).goalCount).toBe(2)
    expect(weekStats(carried).goalsAchieved).toBe(1)
  })

  it("counts scheduled tasks apart from fixed appointments", () => {
    const stats = weekStats(week())
    expect(stats.taskCount).toBe(2)
    expect(stats.tasksCompleted).toBe(1)
    expect(stats.fixedCount).toBe(1)
  })

  it("counts the week's Sharpen the Saw activities, replacing the old dimensions-covered figure", () => {
    expect(weekStats(week()).activityCount).toBe(1)
  })
})

describe("completionPercent", () => {
  it("rounds to whole percentages", () => {
    expect(completionPercent(12, 18)).toBe(67)
    expect(completionPercent(3, 3)).toBe(100)
    expect(completionPercent(0, 4)).toBe(0)
  })

  it("is null when there was nothing to complete, rather than 0% or NaN", () => {
    expect(completionPercent(0, 0)).toBeNull()
  })
})

describe("freeHistoryFloor", () => {
  it("counts the newest week as the first of the three", () => {
    // 24 Aug is the newest past week, so the three on offer are 24, 17 and 10 August.
    expect(freeHistoryFloor("2026-08-24")).toBe("2026-08-10")
  })

  it("returns a Monday", () => {
    expect(new Date(`${freeHistoryFloor("2026-08-24")}T00:00:00`).getDay()).toBe(1)
  })

  it("crosses a month and a year boundary without drifting off Monday", () => {
    expect(freeHistoryFloor("2026-01-11")).toBe("2025-12-28")
    expect(new Date(`${freeHistoryFloor("2026-03-02")}T00:00:00`).getDay()).toBe(1)
  })

  // The window is three weeks wide inclusive of both ends: the floor is the oldest week the
  // account may open, not the first one it may not. This is the strip the sidebar actually draws.
  it("is the last of the three weeks weekStartsBack lists", () => {
    const newest = "2026-08-24"
    const strip = weekStartsBack(newest, FREE_TIER_LIMITS.historyWeeks)

    expect(strip).toEqual(["2026-08-24", "2026-08-17", "2026-08-10"])
    expect(freeHistoryFloor(newest)).toBe(strip[strip.length - 1])
  })
})
