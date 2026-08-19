/** A goal already committed to this week, managed on /roles. */
export interface WeekGoal {
  id: string
  text: string
}

/** One of this week's active roles. */
export interface WeekRole {
  id: string
  name: string
  color: string
  goals: WeekGoal[]
}

/** Last week's goal, offered as a starting point for this one. */
export interface Candidate {
  id: string
  roleId: string
  text: string
}

/**
 * A goal typed in but not yet sent. The page commits everything at once on Next, matching the rest
 * of the weekly-plan flow.
 */
export interface StagedGoal {
  id: string
  text: string
  isPriority: boolean
}
