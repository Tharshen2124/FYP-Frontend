export interface Goal {
  id: string
  text: string
  isWeeklyPriority?: boolean
  isCompleted?: boolean
}

export interface Role {
  id: string
  name: string
  iconId: string
  colorId: string
  goals: Goal[]
}

/** A role retired from planning. Its goals in past weeks are untouched, so it has none here. */
export interface ArchivedRole {
  id: string
  name: string
  iconId: string
  colorId: string
  deletedAt: string
}

/** What archiving would cost, so the confirmation dialog can state real numbers. */
export interface ArchivePreview {
  goals: number
  incompleteTasks: number
  completedTasks: number
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

/** A role awaiting archive confirmation, with the counts the dialog needs. */
export interface PendingRoleArchive {
  role: Role
  preview: ArchivePreview | null
}
