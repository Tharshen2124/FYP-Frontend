"use client"

import { CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatWeekRange } from "@/lib/date"
import type { HistoryWeekMeta } from "../_types"

interface Props {
  weeks: HistoryWeekMeta[]
  selectedWeekStart: string
  onSelectWeek: (weekStart: string) => void
  onJumpToDate: (date: string) => void
  onLoadOlder: () => void
  maxDate: string
}

export function WeekList({
  weeks,
  selectedWeekStart,
  onSelectWeek,
  onJumpToDate,
  onLoadOlder,
  maxDate,
}: Props) {
  return (
    <aside className="w-64 shrink-0 border-r border-border flex flex-col overflow-y-auto bg-card/40">
      <div className="px-4 py-5 border-b border-border space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          <span className="text-sm font-semibold uppercase tracking-wide">Past Weeks</span>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="jump-to-week" className="text-xs text-muted-foreground font-serif">
            Jump to a week
          </label>
          {/*
            Any date resolves to the week containing it, so the user picks a day rather than
            hunting for a Monday. `max` is the newest week this page shows — the one before the
            current one — so the picker cannot offer a week that has not finished happening.
          */}
          <Input
            id="jump-to-week"
            type="date"
            max={maxDate}
            onChange={e => onJumpToDate(e.target.value)}
            className="h-9 bg-muted border-border text-foreground text-sm"
          />
        </div>
      </div>

      <ul className="flex-1 py-2">
        {weeks.map(week => {
          const isSelected = week.weekStart === selectedWeekStart
          const allDone = week.taskCount > 0 && week.tasksCompleted === week.taskCount
          return (
            <li key={week.weekStart}>
              <button
                onClick={() => onSelectWeek(week.weekStart)}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-2 ${
                  isSelected
                    ? "bg-primary/15 border-r-2 border-primary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                }`}
              >
                <span className="text-sm font-serif">{formatWeekRange(week.weekStart)}</span>
                {/* A week with no plan reads "—" rather than 0/0, which would claim it was planned
                    and then wholly unmet. */}
                <span
                  className={`text-xs font-bold tabular-nums shrink-0 ${
                    allDone ? "text-primary" : "text-muted-foreground/70"
                  }`}
                >
                  {week.planned ? `${week.tasksCompleted}/${week.taskCount}` : "—"}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="px-4 py-4 border-t border-border">
        <button
          onClick={onLoadOlder}
          className="w-full text-sm font-serif text-muted-foreground hover:text-foreground transition-colors"
        >
          Load older weeks
        </button>
      </div>
    </aside>
  )
}
