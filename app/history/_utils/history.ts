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
  LegendGroup,
} from "../_types"

/**
 * How a goal resolved **in this week**, which is the only week it belongs to.
 *
 * The order of the tests is the order of precedence:
 *
 * - **Dropped wins over everything.** A goal the user removed is reported as removed even if its
 *   tasks had been ticked off first, because the interesting fact is that it left the week.
 * - **Achieved is read off the tasks** (`Goal.achieved` server-side), so a goal with nothing
 *   scheduled is *not* achieved — nothing to do is not the same as everything done. It falls
 *   through to missed once the week has ended, like any other unfinished goal.
 * - **Missed only once the week is over**, so a live week reads `open` rather than failing early.
 *
 * Carrying forward is not consulted here at all — see {@link GoalOutcome}. It is drawn as its own
 * badge, so an unfinished goal that continued shows a cross *and* an arrow rather than one
 * standing in for the other.
 *
 * `weekHasEnded` is passed in rather than read from the clock here: the caller knows the user's
 * local date, and /history only ever asks about past weeks.
 */
export function goalOutcome(
  { isDropped, isAchieved, weekHasEnded }:
  { isDropped: boolean; isAchieved: boolean; weekHasEnded: boolean }
): GoalOutcome {
  if (isDropped) return "dropped"
  if (isAchieved) return "achieved"
  return weekHasEnded ? "missed" : "open"
}

/** `1 → "1st"`, `3 → "3rd"`, `11 → "11th"`. Only ever used on a small count of weeks, but the
 *  teens are the case a naive last-digit rule gets wrong. */
export function ordinal(n: number): string {
  const lastTwo = n % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`

  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th"
  return `${n}${suffix}`
}

export function toHistoryGoal(goal: ApiHistoryGoal, weekHasEnded: boolean): HistoryGoal {
  return {
    goalId: goal.goal_id,
    text: goal.text,
    isWeeklyPriority: goal.is_weekly_priority,
    outcome: goalOutcome({
      isDropped: goal.is_dropped,
      isAchieved: goal.is_achieved,
      weekHasEnded,
    }),
    weekIndex: goal.week_index,
    isCarriedForward: goal.is_carried_forward,
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
      label: meta?.label ?? task.dimension ?? "Sharpen the Saw",
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
    isWeeklyPriority: task.is_weekly_priority,
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
 * The rows the schedule's footer legend is built from, in the order they are shown.
 *
 * Role goals and Sharpen the Saw activities are the two vocabularies a reader has to tell apart, so they
 * get a row each and are named. Fixed appointments and the schema-permitted unlinked task share
 * the last row: neither belongs to a role or a dimension, which is the only thing that row says.
 */
const LEGEND_ROWS: { key: string; title: string; kinds: CategoryKind[] }[] = [
  { key: "goal", title: "Role goals", kinds: [ "goal" ] },
  { key: "activity", title: "Sharpen the Saw", kinds: [ "activity" ] },
  { key: "other", title: "Other", kinds: [ "fixed", "none" ] },
]

/**
 * The categories the week actually used, grouped for the schedule's footer legend.
 *
 * Keyed by kind *and* label so two roles sharing a colour still get an entry each — the role and
 * dimension palettes overlap, so colour alone cannot be the identity. A row with nothing in it is
 * dropped rather than rendered empty, which is what keeps the legend the week's own.
 */
export function weekLegend(events: HistoryEvent[]): LegendGroup[] {
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

  const all = [ ...entries.values() ]

  return LEGEND_ROWS.map(row => ({
    key: row.key,
    title: row.title,
    entries: all.filter(entry => row.kinds.includes(entry.kind)),
  })).filter(row => row.entries.length > 0)
}

/** The order the goals card explains its glyphs in — how a week reads best, not how the union is
 *  declared: what it met, what it is still on, what it did not, then what left it. */
const OUTCOME_ORDER: GoalOutcome[] = [ "achieved", "missed", "dropped", "open" ]

/**
 * Which outcome markers this week actually used, for the goals card's footer legend.
 *
 * Only the ones present, for the same reason the schedule's legend lists only the week's real
 * categories: explaining a marker that is nowhere on the card invites the question it was added
 * to answer.
 */
export function outcomeLegend(goals: HistoryGoal[]): GoalOutcome[] {
  const present = new Set(goals.map(goal => goal.outcome))
  return OUTCOME_ORDER.filter(outcome => present.has(outcome))
}

/**
 * The four tiles.
 *
 * Dropped goals are out of both halves of the goal ratio: a goal the user pruned is neither an
 * achievement nor a miss, and counting it either way would make pruning change the score. A goal
 * that was *carried forward* stays in, deliberately — this tile is about this week, and in this
 * week it was not achieved. That it continued is the goals card's business, not the ratio's.
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
