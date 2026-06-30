import { type Appt } from "../_types"

export function getOverlaps(all: Appt[], dayIndex: number, startMins: number, endMins: number, excludeId: string) {
  return all.filter(
    a => a.id !== excludeId &&
         a.dayIndex === dayIndex &&
         a.startMins < endMins &&
         a.endMins   > startMins
  )
}

export function getApptPositionStyle(appt: Appt, allAppts: Appt[]): React.CSSProperties {
  const overlapping = getOverlaps(allAppts, appt.dayIndex, appt.startMins, appt.endMins, appt.id)

  if (overlapping.length === 0) {
    return { left: "2px", right: "2px", width: "auto" }
  }

  const group = [appt, ...overlapping].sort(
    (a, b) => a.startMins - b.startMins || a.id.localeCompare(b.id)
  )
  const col = group.findIndex(a => a.id === appt.id)

  return col === 0
    ? { left: "2px",              width: "calc(50% - 3px)", right: "auto" }
    : { left: "calc(50% + 1px)", width: "calc(50% - 3px)", right: "auto" }
}
