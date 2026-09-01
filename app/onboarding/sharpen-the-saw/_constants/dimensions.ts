import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import type { Dimension } from "../_types"

/**
 * The four Sharpen the Saw dimensions from Habit 7 — each starts with no activities.
 *
 * Derived from the app-wide definition rather than restated, the same as `/sharpen-the-saw`. This
 * file was a hand-written copy, and it had drifted: it still painted Social / Emotional in
 * `#FFCC00`, the yellow reserved for a weekly-priority task, which the shared palette moved off
 * some time ago. A second copy of a palette is a second place for it to go stale.
 */
export const INITIAL_DIMENSIONS: Dimension[] = SHARPEN_THE_SAW_DIMENSIONS.map(d => ({ ...d, activities: [] }))
