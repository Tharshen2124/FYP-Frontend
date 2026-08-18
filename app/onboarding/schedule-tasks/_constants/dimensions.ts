import { Flame, Brain, Users, Sparkles } from "lucide-react"
import type { DimensionMeta } from "../_types"

/** The four fixed Sharpen the Saw dimensions — same set as `../sharpen-the-saw`. Real
 *  activities for each are fetched, not hardcoded here. */
export const DIMENSION_META: DimensionMeta[] = [
  { id: "physical", label: "Physical", icon: Flame },
  { id: "spiritual", label: "Spiritual", icon: Sparkles },
  { id: "mental", label: "Mental", icon: Brain },
  { id: "social", label: "Social", icon: Users },
]
