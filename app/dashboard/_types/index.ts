export interface CalEvent {
  id: string
  title: string
  dayIndex: number
  startMins: number
  endMins: number
  color: string
  isFixed?: boolean
  isDailyPriority?: boolean
  linkLabel?: string
}

export type CalItem = Pick<CalEvent, "id" | "dayIndex" | "startMins" | "endMins">
