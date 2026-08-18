import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import type { Dimension } from "../_types"

export function countActivities(dimensions: Dimension[]): number {
  return dimensions.reduce((sum, d) => sum + d.activities.length, 0)
}

/** The Next button unlocks only when every dimension has at least one activity. */
export function allDimensionsFilled(dimensions: Dimension[]): boolean {
  return dimensions.every(d => d.activities.length >= 1)
}

interface BackendActivity {
  sharpen_the_saw_activity_id: number
  dimension: string
  activity_description: string
}

/** Groups the flat, non-deleted activity list returned by the API under each fixed dimension. */
export function groupActivitiesByDimension(activities: BackendActivity[]): Dimension[] {
  return SHARPEN_THE_SAW_DIMENSIONS.map(meta => ({
    ...meta,
    activities: activities
      .filter(a => a.dimension === meta.id)
      .map(a => ({ id: String(a.sharpen_the_saw_activity_id), text: a.activity_description })),
  }))
}
