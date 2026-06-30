import { CalendarDays } from "lucide-react"
import { type Week } from "../_types"

interface Props {
  weeks: Week[]
  selectedWeekId: string
  onSelect: (id: string) => void
}

export function WeekList({ weeks, selectedWeekId, onSelect }: Props) {
  return (
    <aside className="w-64 shrink-0 border-r border-border flex flex-col overflow-y-auto">
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          <span className="text-sm font-semibold uppercase tracking-wide">Weeks</span>
        </div>
      </div>
      <ul className="flex-1 py-2">
        {weeks.map(week => {
          const hasEntries = Object.keys(week.reflections).some(k => week.reflections[k]?.text)
          return (
            <li key={week.id}>
              <button
                onClick={() => onSelect(week.id)}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between gap-2 group ${
                  week.id === selectedWeekId
                    ? "bg-primary/15 border-r-2 border-primary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                }`}
              >
                <span className="text-sm font-serif">{week.label}</span>
                {hasEntries && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
