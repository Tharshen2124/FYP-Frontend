import { Star } from "lucide-react"
import { FIXED_COLOR, TASK_COLOR, WEEKLY_PRIORITY_COLOR } from "../_constants/calendar"

/**
 * Mirrors the onboarding scheduler's legend, so the same swatch means the same thing in the place
 * a task is created and the place it is read back. The "Now" marker is dashboard-only — the
 * onboarding calendars draw no time indicator.
 */
export function TimetableLegend() {
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
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <div className="w-4 border-t-2 border-primary" />
        <span className="text-xs text-muted-foreground font-serif ml-0.5">Now</span>
      </div>
    </div>
  )
}
