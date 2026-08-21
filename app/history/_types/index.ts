import type { ElementType } from "react"

/**
 * How a goal resolved. All four are derived rather than stored — from `is_dropped`, `is_completed`
 * and whether the week has ended — because the server keeps no timezone and so cannot decide the
 * last of those. A dropped goal is reported apart from a missed one, so pruning a goal neither
 * reads as a failure nor quietly raises the completion percentage.
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
  /** The role's colour, the dimension's colour, or the fixed-appointment blue. */
  color: string
  isFixed: boolean
  isCompleted: boolean
  isDailyPriority: boolean
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
 * reader is left to work out that one is a role and the other a renewal dimension.
 */
export interface LegendGroup {
  key: string
  title: string
  entries: LegendEntry[]
}
