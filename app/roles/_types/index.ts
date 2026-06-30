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
