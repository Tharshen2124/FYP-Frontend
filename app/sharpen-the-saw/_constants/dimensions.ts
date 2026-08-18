import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import type { Dimension } from "../_types"

/** The four dimensions of renewal from Habit 7 — seed shape before activities are fetched. */
export const INITIAL_DIMENSIONS: Dimension[] = SHARPEN_THE_SAW_DIMENSIONS.map(d => ({ ...d, activities: [] }))
