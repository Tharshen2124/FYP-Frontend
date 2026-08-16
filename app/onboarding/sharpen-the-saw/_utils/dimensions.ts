import type { Dimension } from "../_types"

export function countActivities(dimensions: Dimension[]): number {
  return dimensions.reduce((sum, d) => sum + d.activities.length, 0)
}

/** The Next button unlocks only when every dimension has at least one activity. */
export function allDimensionsFilled(dimensions: Dimension[]): boolean {
  return dimensions.every(d => d.activities.length >= 1)
}
