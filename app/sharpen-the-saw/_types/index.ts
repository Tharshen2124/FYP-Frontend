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

/** Inline activity rename in progress. */
export interface EditingActivity {
  dimId: string
  actId: string
  text: string
}
