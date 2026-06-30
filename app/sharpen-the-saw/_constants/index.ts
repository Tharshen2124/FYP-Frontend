import { Sparkles, Flame, Brain, Users } from "lucide-react"
import { type Dimension } from "../_types"

export const INITIAL_DIMENSIONS: Dimension[] = [
  {
    id: "physical",
    label: "Physical",
    description: "Exercise, nutrition, rest, and stress management",
    icon: Flame,
    color: "#f97316",
    activities: [],
  },
  {
    id: "spiritual",
    label: "Spiritual",
    description: "Clarifying values, meditation, reflection, and service",
    icon: Sparkles,
    color: "#B13BFF",
    activities: [],
  },
  {
    id: "mental",
    label: "Mental",
    description: "Reading, learning, writing, and creative thinking",
    icon: Brain,
    color: "#14b8a6",
    activities: [],
  },
  {
    id: "social",
    label: "Social / Emotional",
    description: "Meaningful relationships, empathy, and contribution",
    icon: Users,
    color: "#FFCC00",
    activities: [],
  },
]
