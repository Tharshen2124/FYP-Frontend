import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import type { MockDimension } from "../../_types"

interface BackendActivity {
  sharpen_the_saw_activity_id: number
  dimension: string
  activity_description: string
}

/** Groups the fetched (non-deleted) activities under each fixed dimension's shared metadata. */
export function toWeeklyPlanDimensions(activities: BackendActivity[]): MockDimension[] {
  return SHARPEN_THE_SAW_DIMENSIONS.map(({ id, label, color, icon }) => ({
    id,
    label,
    color,
    icon,
    activities: activities
      .filter(a => a.dimension === id)
      .map(a => ({ id: String(a.sharpen_the_saw_activity_id), text: a.activity_description })),
  }))
}
