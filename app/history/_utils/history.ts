import type { ElementType } from "react"
import { Clock, Lock, Target } from "lucide-react"
import type {
  ApiHistoryActivity,
  ApiHistoryGoal,
  ApiHistoryTask,
  ApiHistoryWeek,
} from "@/lib/api"
import { getColor } from "@/lib/role-colors"
import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import { FIXED_COLOR, UNLINKED_COLOR } from "../_constants/history"
import { strToMins } from "./time"
import type {
  CategoryKind,
  GoalOutcome,
  HistoryActivity,
  HistoryEvent,
  HistoryGoal,
  HistoryStats,
  HistoryWeek,
  LegendEntry,
} from "../_types"

/**
 * How a goal resolved.
 *
 * Dropped wins over completed: a goal the user pruned is reported as pruned even if it had been
 * ticked off first, because the interesting fact about it is that it left the week. Missed needs
 * the week to have ended, which is why `weekHasEnded` is passed in rather than read from the clock
 * here — the caller knows the user's local date, and /history only ever asks about past weeks.
 */
export function goalOutcome(
  { isDropped, isCompleted, weekHasEnded }:
  { isDropped: boolean; isCompleted: boolean; weekHasEnded: boolean }
): GoalOutcome {
  if (isDropped) return "dropped"
  if (isCompleted) return "achieved"
  return weekHasEnded ? "missed" : "open"
}

export function toHistoryGoal(goal: ApiHistoryGoal, weekHasEnded: boolean): HistoryGoal {
  return {
    goalId: goal.goal_id,
    text: goal.text,
    isWeeklyPriority: goal.is_weekly_priority,
    outcome: goalOutcome({
      isDropped: goal.is_dropped,
      isCompleted: goal.is_completed,
      weekHasEnded,
    }),
    roleId: goal.role.role_id,
    roleName: goal.role.name,
    // The backend stores only the colour id; the palette lives on the client.
    roleColor: getColor(goal.role.color_id ?? ""),
    roleArchived: goal.role.is_archived,
  }
}

/** The four dimensions' display names and colours live in the frontend, so the raw stored string
 *  ("social") is resolved to its label ("Social / Emotional") here rather than on the server. */
function dimensionMeta(dimension: string) {
  return SHARPEN_THE_SAW_DIMENSIONS.find(d => d.id === dimension)
}

export function toHistoryActivity(activity: ApiHistoryActivity): HistoryActivity {
  const meta = dimensionMeta(activity.dimension)
  return {
    activityId: activity.sharpen_the_saw_activity_id,
    dimensionId: activity.dimension,
    dimensionLabel: meta?.label ?? activity.dimension,
    dimensionColor: meta?.color ?? UNLINKED_COLOR,
    activityText: activity.activity_description,
    isDeleted: activity.is_deleted,
  }
}

/** What a chip is tinted and captioned with, from the parts the server sends. */
function category(
  task: ApiHistoryTask
): { kind: CategoryKind; label: string; color: string; icon: ElementType } {
  if (task.is_fixed_appointment) {
    return { kind: "fixed", label: "Fixed", color: FIXED_COLOR, icon: Lock }
  }

  if (task.link_kind === "goal") {
    return {
      kind: "goal",
      label: task.role_name ?? "Goal",
      color: getColor(task.role_color_id ?? ""),
      icon: Target,
    }
  }

  if (task.link_kind === "activity") {
    const meta = task.dimension ? dimensionMeta(task.dimension) : undefined
    return {
      kind: "activity",
      label: meta?.label ?? task.dimension ?? "Renewal",
      color: meta?.color ?? UNLINKED_COLOR,
      icon: meta?.icon ?? Clock,
    }
  }

  return { kind: "none", label: "Unlinked", color: UNLINKED_COLOR, icon: Clock }
}

export function toHistoryEvent(task: ApiHistoryTask): HistoryEvent {
  const { kind, label, color, icon } = category(task)

  return {
    id: String(task.task_id),
    title: task.title,
    dayIndex: task.day_of_week,
    startMins: strToMins(task.start_time),
    endMins: strToMins(task.end_time),
    color,
    isFixed: task.is_fixed_appointment,
    isCompleted: task.is_completed,
    isDailyPriority: task.is_daily_priority,
    categoryKind: kind,
    categoryLabel: label,
    icon,
  }
}

export function toHistoryWeek(week: ApiHistoryWeek, weekHasEnded: boolean): HistoryWeek {
  return {
    weekStart: week.week_start,
    goals: week.goals.map(g => toHistoryGoal(g, weekHasEnded)),
    activities: week.activities.map(toHistoryActivity),
    events: week.tasks.map(toHistoryEvent),
  }
}

/**
 * The categories the week actually used, for the schedule's footer legend.
 *
 * Fixed first, because it is the one category that is the same every week and reads as the
 * baseline the rest sits against. Keyed by kind *and* label so two roles sharing a colour still
 * get a line each.
 */
export function weekLegend(events: HistoryEvent[]): LegendEntry[] {
  const entries = new Map<string, LegendEntry>()

  for (const event of events) {
    const key = `${event.categoryKind}:${event.categoryLabel}`
    if (entries.has(key)) continue
    entries.set(key, {
      key,
      label: event.categoryLabel,
      color: event.color,
      kind: event.categoryKind,
      icon: event.icon,
    })
  }

  return [...entries.values()].sort((a, b) => {
    if (a.kind === "fixed") return -1
    if (b.kind === "fixed") return 1
    return 0
  })
}

/**
 * The four tiles.
 *
 * Dropped goals are out of both halves of the goal ratio: a goal the user pruned is neither an
 * achievement nor a miss, and counting it either way would make pruning change the score.
 * Fixed appointments are out of the task ratio, since they have a tile of their own.
 */
export function weekStats(week: HistoryWeek): HistoryStats {
  const counted = week.goals.filter(g => g.outcome !== "dropped")
  const tasks = week.events.filter(e => !e.isFixed)

  return {
    goalsAchieved: counted.filter(g => g.outcome === "achieved").length,
    goalCount: counted.length,
    tasksCompleted: tasks.filter(e => e.isCompleted).length,
    taskCount: tasks.length,
    activityCount: week.activities.length,
    fixedCount: week.events.filter(e => e.isFixed).length,
  }
}

/** `12/18` as a percentage, rounded, or null when there was nothing to complete. */
export function completionPercent(done: number, total: number): number | null {
  return total === 0 ? null : Math.round((done / total) * 100)
}
