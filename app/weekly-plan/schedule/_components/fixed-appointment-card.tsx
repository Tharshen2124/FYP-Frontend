import { Lock, Pencil, X } from "lucide-react"
import type { Appt, CalItem } from "../_types"
import { FIXED_COLOR, HR_PX, CAL_START } from "../_constants/calendar"
import { getPositionStyle } from "../_utils/calendar"
import { fmtTime } from "../_utils/time"

interface Props {
  appt: Appt
  allCalItems: CalItem[]
  onEdit: (appt: Appt) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, appt: Appt) => void
}

export function FixedAppointmentCard({ appt, allCalItems, onEdit, onDelete, onDragStart }: Props) {
  const top      = (appt.startMins - CAL_START * 60) * (HR_PX / 60)
  const height   = Math.max((appt.endMins - appt.startMins) * (HR_PX / 60), 22)
  const posStyle = getPositionStyle(appt, allCalItems)

  return (
    <div
      data-appt
      draggable
      onDragStart={e => onDragStart(e, appt)}
      onClick={e => e.stopPropagation()}
      className="absolute rounded-[5px] px-2 py-0.5 cursor-grab active:cursor-grabbing overflow-hidden group"
      style={{
        top, height,
        backgroundColor: `${FIXED_COLOR}20`,
        borderLeft: `3px solid ${FIXED_COLOR}`,
        ...posStyle,
      }}
    >
      <div className="flex items-center gap-1 overflow-hidden">
        <Lock className="w-2.5 h-2.5 flex-shrink-0" style={{ color: FIXED_COLOR }} />
        <p className="text-xs font-bold truncate leading-tight" style={{ color: FIXED_COLOR }}>
          {appt.title}
        </p>
      </div>
      {height >= 42 && (
        <p className="text-[10px] text-muted-foreground leading-tight truncate">
          {fmtTime(appt.startMins)} – {fmtTime(appt.endMins)}
        </p>
      )}
      {height >= 56 && appt.description && (
        <p className="text-[10px] text-muted-foreground font-serif leading-tight truncate mt-0.5">
          {appt.description}
        </p>
      )}
      <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5 z-10">
        <button
          onClick={e => { e.stopPropagation(); onEdit(appt) }}
          className="p-1 rounded bg-card/90 hover:bg-card transition-colors"
        >
          <Pencil className="w-2.5 h-2.5" style={{ color: FIXED_COLOR }} />
        </button>
        {/* Same rule as a completed task: what actually happened this week stays on the calendar. */}
        {!appt.isCompleted && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(appt.id) }}
            aria-label={`Delete ${appt.title}`}
            className="p-1 rounded bg-card/90 hover:bg-card transition-colors"
          >
            <X className="w-2.5 h-2.5 text-destructive" />
          </button>
        )}
      </div>
    </div>
  )
}
