import { Lock, Star } from "lucide-react"
import { fmtTime } from "../_utils/time"
import { getPositionStyle } from "../_utils/calendar"
import type { CalEvent, CalItem } from "../_types"
import { HR_PX, CAL_START } from "../_constants/calendar"

interface Props {
  event: CalEvent
  allItems: CalItem[]
}

export function EventCard({ event, allItems }: Props) {
  const top    = (event.startMins - CAL_START * 60) / 60 * HR_PX
  const height = Math.max(20, (event.endMins - event.startMins) / 60 * HR_PX - 2)
  const pos    = getPositionStyle(event, allItems)
  const short  = height < 36

  return (
    <div
      className="absolute rounded-lg px-2 py-1 overflow-hidden select-none"
      style={{
        top,
        height,
        backgroundColor: `${event.color}22`,
        borderLeft: `3px solid ${event.color}`,
        ...pos,
      }}
    >
      <div className="flex items-start gap-1 h-full overflow-hidden">
        {event.isFixed && (
          <Lock className="w-3 h-3 mt-0.5 shrink-0" style={{ color: event.color }} />
        )}
        {event.isDailyPriority && !event.isFixed && (
          <Star className="w-3 h-3 mt-0.5 shrink-0 fill-current" style={{ color: event.color }} />
        )}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p
            className="text-[11px] font-semibold leading-tight truncate"
            style={{ color: event.color }}
          >
            {event.title}
          </p>
          {!short && (
            <p className="text-[10px] leading-tight mt-0.5 opacity-70 truncate" style={{ color: event.color }}>
              {fmtTime(event.startMins)} – {fmtTime(event.endMins)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
