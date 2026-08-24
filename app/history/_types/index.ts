import type { ElementType } from "react"

/**
 * How a goal resolved *in its own week* — derived rather than stored, from `is_achieved`,
 * `is_dropped` and whether the week has ended, because the server keeps no timezone and so cannot
 * decide the last of those.
 *
 * Carrying forward is deliberately **not** one of these. It is a different claim about a different
 * week: a carryover copies the goal into the next week and leaves this row where it is
 * (`goals_controller#carry`), so "did the work happen here?" and "did it continue?" are independent
 * and a goal can answer both. `HistoryGoal.isCarriedForward` carries the second, drawn as a badge
 * beside the outcome. Folding it in here forced the card to pick a winner between them.
 *
 * `dropped` stays, because it really is an alternative to the other three: a goal the user pruned
 * neither reads as a failure nor quietly raises the completion percentage.
 */
export type GoalOutcome = "achieved" | "dropped" | "missed" | "open"

/** What a schedule chip was for. `none` is the schema-permitted, UI-unreachable unlinked task. */
export type CategoryKind = "fixed" | "goal" | "activity" | "none"

export interface HistoryEvent {
  id: string
  title: string
  dayIndex: number
  startMins: number
  endMins: number
  /** The role's colour, the dimension's colour, or the fixed-appointment blue.
   *
   *  Deliberately the *category's* colour even when the chip is drawn in the reserved yellow: the
   *  footer legend names the week's roles and dimensions, and a weekly-priority task must not
   *  rename its role to yellow there. What the chip paints is {@link HistoryEvent.isWeeklyPriority}
   *  applied on top of this. */
  color: string
  isFixed: boolean
  isCompleted: boolean
  isDailyPriority: boolean
  /** Whether the goal behind this task was one of that week's priorities — the reserved yellow. */
  isWeeklyPriority: boolean
  categoryKind: CategoryKind
  /** "Fixed", the role's name, or the dimension's display label. */
  categoryLabel: string
  icon: ElementType
}

export interface HistoryGoal {
  goalId: number
  text: string
  isWeeklyPriority: boolean
  outcome: GoalOutcome
  /** How many weeks this goal has been running, this one included. 1 means it started here. */
  weekIndex: number
  isCarriedForward: boolean
  roleId: number
  roleName: string
  roleColor: string
  roleArchived: boolean
}

export interface HistoryActivity {
  activityId: number
  dimensionId: string
  dimensionLabel: string
  dimensionColor: string
  activityText: string
  isDeleted: boolean
}

export interface HistoryWeek {
  weekStart: string
  goals: HistoryGoal[]
  activities: HistoryActivity[]
  events: HistoryEvent[]
}

/** One row of the sidebar strip. `planned` is false for a week the server had nothing for. */
export interface HistoryWeekMeta {
  weekStart: string
  planned: boolean
  taskCount: number
  tasksCompleted: number
}

/** The four tiles above the cards. Ratios rather than bare counts: a past week raises the question
 *  of how it went, not of how much of it was scheduled. */
export interface HistoryStats {
  goalsAchieved: number
  goalCount: number
  tasksCompleted: number
  taskCount: number
  activityCount: number
  fixedCount: number
}

/** One entry of the schedule's footer legend — the week's real categories, not a static pair. */
export interface LegendEntry {
  key: string
  label: string
  color: string
  kind: CategoryKind
  icon: ElementType
}

/**
 * One row of that legend: a kind of category, and the week's real members of it.
 *
 * Split rather than listed flat because a role name and a dimension label look identical once
 * they are dots on the same line — "Parent" and "Physical" read as the same vocabulary, and the
 * reader is left to work out that one is a role and the other a Sharpen the Saw dimension.
 */
export interface LegendGroup {
  key: string
  title: string
  entries: LegendEntry[]
}
