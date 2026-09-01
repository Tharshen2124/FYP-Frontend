import { Check, Lock, Star } from "lucide-react"
import { paintedColor } from "../_utils/events"
import { fmtTime } from "../_utils/time"
import { getPositionStyle } from "../_utils/calendar"
import type { CalEvent, CalItem } from "../_types"
import { HR_PX, CAL_START, WEEKLY_PRIORITY_COLOR } from "../_constants/calendar"

interface Props {
  event: CalEvent
  allItems: CalItem[]
  /** Opens the detail dialog. The card truncates its title and drops everything else the task
   *  knows, so this is the only way to read one in full. */
  onSelect: () => void
}

export function EventCard({ event, allItems, onSelect }: Props) {
  const top    = (event.startMins - CAL_START * 60) / 60 * HR_PX
  const height = Math.max(20, (event.endMins - event.startMins) / 60 * HR_PX - 2)
  const pos    = getPositionStyle(event, allItems)
  const short  = height < 36
  /* The reserved yellow overrides the role's own colour here rather than in `toCalEvents`, so the
     legend can go on naming the role: a yellow card still belongs to one. */
  const color  = paintedColor(event)

  return (
    <button
      type="button"
      onClick={onSelect}
      /* The title is visually truncated and a 20px card shows no time at all, so the accessible
         name has to carry what the eye gets from the grid position. */
      aria-label={`${event.title}, ${fmtTime(event.startMins)} to ${fmtTime(event.endMins)}${
        event.isCompleted ? ", completed" : ""
      }`}
      className="absolute rounded-lg px-2 py-1 overflow-hidden select-none text-left cursor-pointer transition hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{
        top,
        height,
        backgroundColor: `${color}22`,
        borderLeft: `3px solid ${color}`,
        ...pos,
      }}
    >
      <div className="flex items-start gap-1 h-full overflow-hidden">
        {event.isFixed && (
          <Lock className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} />
        )}
        {/* Always the reserved yellow, never the card's own colour. A daily priority is the one
            mark that has to read the same on a role-coloured card and a yellow one. */}
        {event.isDailyPriority && !event.isFixed && (
          <Star
            className="w-3 h-3 mt-0.5 shrink-0 fill-current"
            style={{ color: WEEKLY_PRIORITY_COLOR }}
            aria-label="Daily priority"
          />
        )}
        {/* Ticked off in the End-of-Day check-in or in the detail dialog. The same mark /history
            uses, so the live week and the recorded one read the same way. */}
        {event.isCompleted && (
          <Check className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} aria-label="Completed" />
        )}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p
            className={`text-[11px] font-semibold leading-tight truncate ${
              event.isCompleted ? "line-through opacity-60" : ""
            }`}
            style={{ color }}
          >
            {event.title}
          </p>
          {!short && (
            <p className="text-[10px] leading-tight mt-0.5 opacity-70 truncate" style={{ color }}>
              {fmtTime(event.startMins)} – {fmtTime(event.endMins)}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
