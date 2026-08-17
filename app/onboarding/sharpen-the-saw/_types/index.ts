import type { ElementType } from "react"

export interface Activity {
  id: string
  text: string
}

export interface Dimension {
  id: string
  label: string
  description: string
  icon: ElementType
  color: string
  activities: Activity[]
}

/** Identifies the activity currently being renamed inline. */
export interface EditingActivityId {
  dimId: string
  actId: string
}
