import { Lock } from "lucide-react"
import type { FixedAppt, CalItem } from "../_types"
import { FIXED_COLOR, HR_PX, CAL_START } from "../_constants/calendar"
import { getPositionStyle } from "../_utils/calendar"
import { fmtTime } from "../_utils/time"

interface Props {
  appt: FixedAppt
  allCalItems: CalItem[]
}

export function FixedAppointmentCard({ appt, allCalItems }: Props) {
  const top      = (appt.startMins - CAL_START * 60) * (HR_PX / 60)
  const height   = Math.max((appt.endMins - appt.startMins) * (HR_PX / 60), 22)
  const posStyle = getPositionStyle(appt, allCalItems)

  return (
    <div
      data-task
      onClick={e => e.stopPropagation()}
      className="absolute rounded-[5px] px-2 py-0.5 overflow-hidden"
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
    </div>
  )
}
