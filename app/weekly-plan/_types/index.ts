import type { ElementType } from "react"

/**
 * Types shared by every route in the `/weekly-plan` flow.
 * Route-specific types live in that route's own `_types/index.ts`.
 *
 * These describe the week being planned, not a standing library: a role's `goals` are the ones it
 * holds in *that* week, and a dimension's `activities` are the ones committed to it.
 */

export interface PlanGoal {
  id: string
  text: string
}

export interface PlanRole {
  id: string
  name: string
  color: string
  goals: PlanGoal[]
}

export interface PlanActivity {
  id: string
  text: string
}

export interface PlanDimension {
  id: string
  label: string
  color: string
  icon: ElementType
  activities: PlanActivity[]
}
