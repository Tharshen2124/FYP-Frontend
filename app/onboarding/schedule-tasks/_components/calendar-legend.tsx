import { Star } from "lucide-react"
import { FIXED_COLOR, TASK_COLOR, DAILY_PRIORITY_COLOR } from "../_constants/calendar"

export function CalendarLegend() {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: `${FIXED_COLOR}40`, borderLeft: `3px solid ${FIXED_COLOR}` }}
        />
        <span className="text-xs text-muted-foreground font-serif">Fixed Appointments</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: `${TASK_COLOR}40`, borderLeft: `3px solid ${TASK_COLOR}` }}
        />
        <span className="text-xs text-muted-foreground font-serif">Your Tasks</span>
      </div>
      <div className="flex items-center gap-1">
        <Star className="w-3 h-3" style={{ color: DAILY_PRIORITY_COLOR, fill: DAILY_PRIORITY_COLOR }} />
        <span className="text-xs text-muted-foreground font-serif">Daily Priority</span>
      </div>
    </div>
  )
}
