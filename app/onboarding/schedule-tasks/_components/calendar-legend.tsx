import { Star } from "lucide-react"
import { FIXED_COLOR, TASK_COLOR, WEEKLY_PRIORITY_COLOR } from "../_constants/calendar"

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
      {/* The swatch and the star are two different claims, so they are two entries. A yellow card
          is work on a weekly-priority goal; a star is a task picked out for its day, whatever
          colour the card underneath it is. */}
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: `${WEEKLY_PRIORITY_COLOR}40`, borderLeft: `3px solid ${WEEKLY_PRIORITY_COLOR}` }}
        />
        <span className="text-xs text-muted-foreground font-serif">Weekly Priority</span>
      </div>
      <div className="flex items-center gap-1">
        <Star className="w-3 h-3" style={{ color: WEEKLY_PRIORITY_COLOR, fill: WEEKLY_PRIORITY_COLOR }} />
        <span className="text-xs text-muted-foreground font-serif">Daily Priority</span>
      </div>
    </div>
  )
}
