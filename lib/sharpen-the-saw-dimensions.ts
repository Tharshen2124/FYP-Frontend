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
 * The four fixed dimensions of renewal from Habit 7 — single source of truth for their
 * static metadata. Consumed by /sharpen-the-saw and /weekly-plan/sharpen-the-saw.
 */
export const SHARPEN_THE_SAW_DIMENSIONS: SharpenTheSawDimensionMeta[] = [
  {
    id: "physical",
    label: "Physical",
    description: "Exercise, nutrition, rest, and stress management",
    icon: Flame,
    color: "#f97316",
  },
  {
    id: "spiritual",
    label: "Spiritual",
    description: "Clarifying values, meditation, reflection, and service",
    icon: Sparkles,
    color: "#B13BFF",
  },
  {
    id: "mental",
    label: "Mental",
    description: "Reading, learning, writing, and creative thinking",
    icon: Brain,
    color: "#14b8a6",
  },
  {
    id: "social",
    label: "Social / Emotional",
    description: "Meaningful relationships, empathy, and contribution",
    icon: Users,
    color: "#FFCC00",
  },
]
