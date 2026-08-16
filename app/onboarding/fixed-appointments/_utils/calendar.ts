import type { CalItem } from "../_types"

/** Returns the appointments overlapping a given time range on a given day. */
export function getOverlaps<T extends CalItem>(
  all: T[],
  dayIndex: number,
  startMins: number,
  endMins: number,
  excludeId: string
): T[] {
  return all.filter(
    a => a.id !== excludeId &&
         a.dayIndex === dayIndex &&
         a.startMins < endMins &&
         a.endMins   > startMins
  )
}

/**
 * Returns inline style overrides for an appointment card.
 * When 2 events overlap, they split the column 50/50 (Google Calendar style).
 * Sort order: earlier startMins goes left; ties broken by id for stability.
 */
export function getPositionStyle(item: CalItem, allItems: CalItem[]): React.CSSProperties {
  const overlapping = getOverlaps(allItems, item.dayIndex, item.startMins, item.endMins, item.id)
  if (overlapping.length === 0) return { left: "2px", right: "2px", width: "auto" }

  const group = [item, ...overlapping].sort(
    (a, b) => a.startMins - b.startMins || a.id.localeCompare(b.id)
  )
  const col = group.findIndex(a => a.id === item.id)

  return col === 0
    ? { left: "2px",             width: "calc(50% - 3px)", right: "auto" }
    : { left: "calc(50% + 1px)", width: "calc(50% - 3px)", right: "auto" }
}
