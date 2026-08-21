import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import type { PlanDimension } from "../_types"

export interface ApiActivity {
  sharpen_the_saw_activity_id: number
  dimension: string
  activity_description: string
}

/**
 * Groups activities under the four fixed dimensions' shared metadata.
 *
 * Lives at the flow level rather than in one route's `_utils` because both steps that show
 * renewal activities need it: the renewal step lists the whole library to choose from, and the
 * schedule step offers only `committedIds` — the ones the user actually committed to this week,
 * which is what makes the choosing step mean anything.
 */
export function toPlanDimensions(
  activities: ApiActivity[],
  committedIds?: Set<string>
): PlanDimension[] {
  const visible = committedIds
    ? activities.filter(a => committedIds.has(String(a.sharpen_the_saw_activity_id)))
    : activities

  return SHARPEN_THE_SAW_DIMENSIONS.map(({ id, label, color, icon }) => ({
    id,
    label,
    color,
    icon,
    activities: visible
      .filter(a => a.dimension === id)
      .map(a => ({ id: String(a.sharpen_the_saw_activity_id), text: a.activity_description })),
  }))
}
