"use client"

import { Clock, Lock, Target, Zap } from "lucide-react"
import { StatBadge } from "./stat-badge"
import { GoalsCard } from "./goals-card"
import { ActivitiesCard } from "./activities-card"
import { ScheduleCard } from "./schedule-card"
import type { HistoryWeek } from "../_types"

interface Props {
  week: HistoryWeek
}

export function WeekDetail({ week }: Props) {
  const fixedCount = week.events.filter(e => e.isFixed).length
  const taskCount = week.events.filter(e => !e.isFixed).length
  const dimCount = new Set(week.activities.map(a => a.dimensionId)).size

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Week of <span className="text-primary">{week.label}</span>
        </h2>
        <p className="text-muted-foreground font-serif text-sm mt-0.5">
          A snapshot of your goals, activities, and schedule for this week.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge value={week.goals.length} label="Goals active"       icon={<Target className="w-4 h-4" />} />
        <StatBadge value={dimCount}          label="Dimensions covered" icon={<Zap    className="w-4 h-4" />} />
        <StatBadge value={fixedCount}        label="Fixed appointments" icon={<Lock   className="w-4 h-4" />} />
        <StatBadge value={taskCount}         label="Scheduled tasks"    icon={<Clock  className="w-4 h-4" />} />
      </div>

      {/* Goals + Activities side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GoalsCard goals={week.goals} />
        <ActivitiesCard activities={week.activities} />
      </div>

      {/* Full-width schedule */}
      <ScheduleCard week={week} />
    </div>
  )
}
