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
  /** Named a priority for this week on /roles. A task serving one is drawn in the reserved yellow
   *  rather than the role's own colour. */
  isWeeklyPriority: boolean
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

/**
 * Which Sharpen the Saw activities a week's link picker may offer.
 *
 * `"committed"` is the planning rule: the wizard's Sharpen the Saw step is where the week's set is
 * chosen, and offering the rest of the library on the step after it would make that choice
 * decoration.
 *
 * `"library"` is `/weekly-plan/edit`, and is the counterpart of the `pastDays="open"` it hands the
 * same tabs. There is no step in front of that page: the committed set of a week already planned
 * cannot be reopened from anywhere — the wizard moves to next week once this one has a plan, and
 * `/sharpen-the-saw` writes the standing library and commits nothing — so filtering by it there
 * leaves an activity added since unschedulable for the rest of the week, with nothing on screen to
 * say why. The server has always allowed it: `POST /weekly-plans/tasks` validates an activity
 * against the user's library rather than the week's set, and commits whatever a task is actually
 * scheduled against.
 */
export type ActivitySource = "committed" | "library"
