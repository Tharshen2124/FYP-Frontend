import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import type { DimensionMeta } from "../_types"

/** The four fixed Sharpen the Saw dimensions, taken from the app-wide definition rather than
 *  restated: the calendar tints a task by its dimension, and a second copy of those colours is a
 *  second place the palette can drift out of step with the role palette it must stay clear of.
 *  Real activities for each are fetched, not hardcoded here. */
export const DIMENSION_META: DimensionMeta[] = SHARPEN_THE_SAW_DIMENSIONS.map(
  ({ id, label, icon, color }) => ({ id, label, icon, color })
)
