export interface CategoryItem {
  id: string
  label: string
  parentId?: string
}

export interface CalSettings {
  allowSync: boolean
  exportIds: Set<string>
}
