export interface CategoryItem {
  id: string
  label: string
  parentId?: string
  /**
   * The backend's own id for this leaf — a Sharpen the Saw dimension id, or a `role_id`. Carried
   * here rather than parsed back out of `id` so that renaming a role, or renaming the tree's id
   * scheme, cannot quietly change which role a saved preference refers to. Absent on parents and
   * on Fixed Appointments, which is a category with no id behind it.
   */
  dimensionId?: string
  roleId?: number
}

export interface CalSettings {
  allowSync: boolean
  exportIds: Set<string>
}
