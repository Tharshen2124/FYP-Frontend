import type { CalItem, FixedAppt, Task } from "../_types"

export function getOverlaps(
  all: CalItem[],
  dayIndex: number,
  startMins: number,
  endMins: number,
  excludeId: string
): CalItem[] {
  return all.filter(
    e =>
      e.id !== excludeId &&
      e.dayIndex === dayIndex &&
      e.startMins < endMins &&
      e.endMins   > startMins
  )
}

export function getPositionStyle(item: CalItem, allItems: CalItem[]): React.CSSProperties {
  const overlapping = getOverlaps(allItems, item.dayIndex, item.startMins, item.endMins, item.id)
  if (overlapping.length === 0) return { left: "2px", right: "2px", width: "auto" }

  const group = [item, ...overlapping].sort(
    (a, b) => a.startMins - b.startMins || a.id.localeCompare(b.id)
  )
  const col = group.findIndex(a => a.id === item.id)
  return col === 0
    ? { left: "2px",              width: "calc(50% - 3px)", right: "auto" }
    : { left: "calc(50% + 1px)", width: "calc(50% - 3px)", right: "auto" }
}

/**
 * Every block on the grid as one list, which is what a clash check and an overlap layout both
 * need: a task may land on a fixed appointment as readily as on another task, and neither is
 * special to the geometry.
 */
export function toCalItems(fixedAppts: FixedAppt[], tasks: Task[]): CalItem[] {
  return [
    ...fixedAppts,
    ...tasks.map(t => ({ id: t.id, dayIndex: t.dayIndex, startMins: t.startMins, endMins: t.endMins })),
  ]
}
