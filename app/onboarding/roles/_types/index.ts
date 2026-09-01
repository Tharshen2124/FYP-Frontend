export interface Goal {
  id: string
  text: string
  isWeeklyPriority?: boolean
}

export interface Role {
  id: string
  name: string
  iconId: string
  colorId: string
  goals: Goal[]
}

/** Inline goal edit in progress. */
export interface EditingGoal {
  roleId: string
  goalId: string
  text: string
}

/** A goal held back by the "too many goals" warning until the user confirms. */
export interface PendingGoal {
  roleId: string
  text: string
}
