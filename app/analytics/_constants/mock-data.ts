import type {
  DailyPriorityDay,
  DateSelection,
  WeekId,
  WeekRegistryEntry,
  WeeklyCompletion,
} from "../_types"

// ---------------------------------------------------------------------------
// Week registry — every dataset below is keyed by these week ids
// ---------------------------------------------------------------------------

export const WEEK_REGISTRY: WeekRegistryEntry[] = [
  { id: "w1", label: "26 May – 1 Jun",  start: new Date(2026, 4, 26), end: new Date(2026, 5, 1)  },
  { id: "w2", label: "19 May – 25 May", start: new Date(2026, 4, 19), end: new Date(2026, 4, 25) },
  { id: "w3", label: "12 May – 18 May", start: new Date(2026, 4, 12), end: new Date(2026, 4, 18) },
  { id: "w4", label: "5 May – 11 May",  start: new Date(2026, 4, 5),  end: new Date(2026, 4, 11) },
  { id: "w5", label: "28 Apr – 4 May",  start: new Date(2026, 3, 28), end: new Date(2026, 4, 4)  },
]

// ---------------------------------------------------------------------------
// Selector options
// ---------------------------------------------------------------------------

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

// Derive years from stored data + current + next year so it grows automatically
export const AVAILABLE_YEARS: number[] = (() => {
  const set = new Set<number>()
  for (const w of WEEK_REGISTRY) {
    set.add(w.start.getFullYear())
    set.add(w.end.getFullYear())
  }
  const now = new Date().getFullYear()
  set.add(now)
  set.add(now + 1)
  return [...set].sort((a, b) => a - b)
})()

// Default: start of the most recent week
export const DEFAULT_FROM: DateSelection = { day: 26, month: 4, year: 2026 }
export const DEFAULT_TO:   DateSelection = { day: 1,  month: 5, year: 2026 }
export const DEFAULT_DATE: DateSelection = { day: 26, month: 4, year: 2026 }

// ---------------------------------------------------------------------------
// Sharpen the Saw — per-dimension scores, averaged across a date range
// ---------------------------------------------------------------------------

export const DIMENSION_META = [
  { dimension: "Physical",  color: "#22c55e" },
  { dimension: "Spiritual", color: "#B13BFF" },
  { dimension: "Mental",    color: "#14b8a6" },
  { dimension: "Social",    color: "#FFCC00" },
]

export const SHARPEN_RAW: Record<WeekId, number[]> = {
  //       Phys  Spirit  Mental  Social
  w1: [78, 45,   85,     62],
  w2: [65, 55,   80,     70],
  w3: [90, 40,   75,     55],
  w4: [70, 60,   70,     80],
  w5: [60, 50,   90,     65],
}

// ---------------------------------------------------------------------------
// Role task stats — summed across a date range
// ---------------------------------------------------------------------------

export const ROLE_META = [
  { role: "Programmer", color: "#B13BFF" },
  { role: "Athlete",    color: "#22c55e" },
  { role: "Student",    color: "#FFCC00" },
  { role: "Reader",     color: "#14b8a6" },
]

export const ROLE_RAW: Record<WeekId, [number, number][]> = {
  //       Prog      Athlete   Student   Reader
  w1: [[16, 20], [9,  20], [6,  20], [14, 20]],
  w2: [[12, 18], [11, 20], [8,  16], [10, 18]],
  w3: [[15, 20], [7,  15], [5,  18], [16, 20]],
  w4: [[10, 16], [13, 20], [9,  20], [8,  16]],
  w5: [[14, 20], [8,  18], [7,  14], [12, 20]],
}

// ---------------------------------------------------------------------------
// Daily priority — for the single week containing the selected date
// ---------------------------------------------------------------------------

export const DAILY_RAW: Record<WeekId, DailyPriorityDay[]> = {
  w1: [
    { day: "Mon", completed: 3, total: 3 },
    { day: "Tue", completed: 2, total: 3 },
    { day: "Wed", completed: 3, total: 3 },
    { day: "Thu", completed: 1, total: 3 },
    { day: "Fri", completed: 2, total: 3 },
    { day: "Sat", completed: 0, total: 2 },
    { day: "Sun", completed: 2, total: 2 },
  ],
  w2: [
    { day: "Mon", completed: 2, total: 3 },
    { day: "Tue", completed: 3, total: 3 },
    { day: "Wed", completed: 1, total: 3 },
    { day: "Thu", completed: 3, total: 3 },
    { day: "Fri", completed: 2, total: 3 },
    { day: "Sat", completed: 1, total: 2 },
    { day: "Sun", completed: 0, total: 2 },
  ],
  w3: [
    { day: "Mon", completed: 3, total: 3 },
    { day: "Tue", completed: 3, total: 3 },
    { day: "Wed", completed: 2, total: 3 },
    { day: "Thu", completed: 2, total: 3 },
    { day: "Fri", completed: 3, total: 3 },
    { day: "Sat", completed: 2, total: 2 },
    { day: "Sun", completed: 1, total: 2 },
  ],
  w4: [
    { day: "Mon", completed: 1, total: 3 },
    { day: "Tue", completed: 2, total: 3 },
    { day: "Wed", completed: 2, total: 3 },
    { day: "Thu", completed: 1, total: 3 },
    { day: "Fri", completed: 1, total: 3 },
    { day: "Sat", completed: 0, total: 2 },
    { day: "Sun", completed: 1, total: 2 },
  ],
  w5: [
    { day: "Mon", completed: 2, total: 3 },
    { day: "Tue", completed: 1, total: 3 },
    { day: "Wed", completed: 3, total: 3 },
    { day: "Thu", completed: 2, total: 3 },
    { day: "Fri", completed: 2, total: 3 },
    { day: "Sat", completed: 1, total: 2 },
    { day: "Sun", completed: 2, total: 2 },
  ],
}

// ---------------------------------------------------------------------------
// Weekly task completion — full history, no date filter (trend chart + table)
// ---------------------------------------------------------------------------

export const WEEKLY_COMPLETIONS: WeeklyCompletion[] = [
  { id: "w1", label: "26 May – 1 Jun",  completed: 23, total: 28, trend: "up"   },
  { id: "w2", label: "19 May – 25 May", completed: 20, total: 27, trend: "down" },
  { id: "w3", label: "12 May – 18 May", completed: 22, total: 26, trend: "up"   },
  { id: "w4", label: "5 May – 11 May",  completed: 17, total: 25, trend: "down" },
  { id: "w5", label: "28 Apr – 4 May",  completed: 19, total: 24, trend: "flat" },
]
