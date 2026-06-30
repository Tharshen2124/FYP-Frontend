export interface DayReflection {
  text: string
}

export interface Week {
  id: string
  label: string
  reflections: Record<string, DayReflection>
  summary: string
}
