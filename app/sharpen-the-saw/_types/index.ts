export interface Activity {
  id: string
  text: string
  isWeeklyPriority?: boolean
}

export interface Dimension {
  id: string
  label: string
  description: string
  icon: React.ElementType
  color: string
  activities: Activity[]
}
