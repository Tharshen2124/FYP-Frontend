import type { ElementType } from "react"

/**
 * Types shared by every route in the `/weekly-plan` flow.
 * Route-specific types live in that route's own `_types/index.ts`.
 */

export interface MockGoal {
  id: string
  text: string
}

export interface MockRole {
  id: string
  name: string
  color: string
  goals: MockGoal[]
}

export interface MockActivity {
  id: string
  text: string
}

export interface MockDimension {
  id: string
  label: string
  color: string
  icon: ElementType
  activities: MockActivity[]
}
