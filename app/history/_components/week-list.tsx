"use client"

import { CalendarDays } from "lucide-react"
import type { HistoryWeek } from "../_types"

interface Props {
  weeks: HistoryWeek[]
  selectedId: string
  onSelect: (id: string) => void
}

export function WeekList({ weeks, selectedId, onSelect }: Props) {
  return (
    <aside className="w-56 shrink-0 border-r border-border flex flex-col overflow-y-auto bg-card/40">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Past Weeks</span>
        </div>
      </div>
      <ul className="flex-1 py-2">
        {weeks.map(week => (
          <li key={week.id}>
            <button
              onClick={() => onSelect(week.id)}
              className={[
                "w-full text-left px-4 py-3 transition-colors",
                week.id === selectedId
                  ? "bg-primary/15 border-r-2 border-primary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground",
              ].join(" ")}
            >
              <p className="text-xs font-serif leading-snug">{week.label}</p>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
