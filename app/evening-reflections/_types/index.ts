export interface DayReflection {
  text: string
}

export interface Week {
  id: string
  label: string
  /** Keyed by day name, e.g. "Monday". */
  reflections: Record<string, DayReflection>
  summary: string
}
