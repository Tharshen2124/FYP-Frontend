"use client"

import { CheckCircle2, Loader2, Lock, Target, Zap } from "lucide-react"
import { formatWeekRange } from "@/lib/date"
import { completionPercent, weekStats } from "../_utils/history"
import { StatBadge } from "./stat-badge"
import { GoalsCard } from "./goals-card"
import { ActivitiesCard } from "./activities-card"
import { ScheduleCard } from "./schedule-card"
import type { HistoryWeek } from "../_types"

interface Props {
  weekStart: string
  week: HistoryWeek | null
  isLoading: boolean
}

export function WeekDetail({ weekStart, week, isLoading }: Props) {
  return (
    <div className="space-y-6">
      {/* The heading renders before any data arrives: app-navigation.spec.ts asserts a heading is
          visible on every route, and the week strip is useful while the panel loads. */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Week of <span className="text-primary">{formatWeekRange(weekStart)}</span>
        </h1>
        <p className="text-muted-foreground font-serif text-sm mt-0.5">
          A snapshot of how this week turned out — its goals, Sharpen the Saw activities, and schedule.
        </p>
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 text-muted-foreground font-serif mt-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading this week…
        </p>
      ) : week === null ? (
        /* A week with no plan has no history to show. Unlike /evening-reflections there is no offer
           to go and plan it: planning a week that has already gone would change nothing that
           happened in it. */
        <div className="p-6 rounded-2xl bg-card border-2 border-border">
          <p className="text-muted-foreground font-serif">
            You didn&apos;t plan this week, so there&apos;s nothing to look back on.
          </p>
        </div>
      ) : (
        <>
          <StatsRow week={week} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GoalsCard goals={week.goals} />
            <ActivitiesCard activities={week.activities} />
          </div>

          <ScheduleCard week={week} />
        </>
      )}
    </div>
  )
}

/**
 * Four figures about how the week went, rather than how much of it was scheduled.
 *
 * "Dimensions covered" used to sit where "STS activities" now does — a number between 0 and 4 that
 * said nothing a glance at the card below would not. The badge label is truncated at a quarter of
 * the row, which is why this one abbreviates where the rest of the page spells "Sharpen the Saw"
 * out — the schedule legend below it names the term in full.
 */
function StatsRow({ week }: { week: HistoryWeek }) {
  const stats = weekStats(week)
  const percent = completionPercent(stats.tasksCompleted, stats.taskCount)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatBadge
        value={`${stats.goalsAchieved}/${stats.goalCount}`}
        label="Goals achieved"
        icon={<Target className="w-4 h-4" />}
      />
      <StatBadge
        value={`${stats.tasksCompleted}/${stats.taskCount}`}
        label="Tasks done"
        sublabel={percent === null ? undefined : `(${percent}%)`}
        icon={<CheckCircle2 className="w-4 h-4" />}
      />
      <StatBadge
        value={stats.activityCount}
        label="STS activities"
        icon={<Zap className="w-4 h-4" />}
      />
      <StatBadge
        value={stats.fixedCount}
        label="Fixed appointments"
        icon={<Lock className="w-4 h-4" />}
      />
    </div>
  )
}
