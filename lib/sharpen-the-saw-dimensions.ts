import type { ElementType } from "react"
import { Brain, Flame, Sparkles, Users } from "lucide-react"

export type SharpenTheSawDimensionId = "physical" | "spiritual" | "mental" | "social"

export interface SharpenTheSawDimensionMeta {
  id: SharpenTheSawDimensionId
  label: string
  description: string
  icon: ElementType
  color: string
}

/**
 * The four fixed Sharpen the Saw dimensions from Habit 7 — single source of truth for their
 * static metadata. Consumed by /sharpen-the-saw and /weekly-plan/sharpen-the-saw.
 *
 * **The colours are disjoint from `ROLE_COLORS` by rule, not by accident.** Every calendar in
 * the app tints a task by the role or the dimension behind it, and the two vocabularies share one
 * grid — so a block the reader cannot decode to exactly one of them is a legend that lies. These
 * four also avoid `WEEKLY_PRIORITY_COLOR` and the fixed-appointment blue (#3b82f6) for the
 * same reason. `tests/unit/roles.test.ts` holds both palettes to it.
 */
export const SHARPEN_THE_SAW_DIMENSIONS: SharpenTheSawDimensionMeta[] = [
  {
    id: "physical",
    label: "Physical",
    description: "Exercise, nutrition, rest, and stress management",
    icon: Flame,
    // Green rather than the orange this dimension used to be: orange is a role colour, and a
    // calendar tints role goals and dimensions on the same grid.
    color: "#22c55e",
  },
  {
    id: "spiritual",
    label: "Spiritual",
    description: "Clarifying values, meditation, reflection, and service",
    icon: Sparkles,
    // Indigo rather than the magenta this dimension used to be — magenta is the default role colour.
    color: "#818cf8",
  },
  {
    id: "mental",
    label: "Mental",
    description: "Reading, learning, writing, and creative thinking",
    icon: Brain,
    // Sky rather than the teal this dimension used to be. Pale enough to read apart from the
    // fixed-appointment blue as well as from the teal a role may still take.
    color: "#7dd3fc",
  },
  {
    id: "social",
    label: "Social / Emotional",
    description: "Meaningful relationships, empathy, and contribution",
    icon: Users,
    // Pink, having been yellow and then rose: yellow is reserved for a task under a weekly-priority
    // goal (WEEKLY_PRIORITY_COLOR) and rose is a role colour, and the schedules tint by both.
    color: "#f472b6",
  },
]
