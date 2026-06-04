import type { CalEvent } from "../_types"

export const MOCK_EVENTS: CalEvent[] = [
  // Fixed appointments (blue)
  { id: "fa1", title: "Morning Workout",  dayIndex: 0, startMins: 7 * 60,        endMins: 8 * 60,        color: "#3b82f6", isFixed: true },
  { id: "fa2", title: "Morning Workout",  dayIndex: 2, startMins: 7 * 60,        endMins: 8 * 60,        color: "#3b82f6", isFixed: true },
  { id: "fa3", title: "Morning Workout",  dayIndex: 4, startMins: 7 * 60,        endMins: 8 * 60,        color: "#3b82f6", isFixed: true },
  { id: "fa4", title: "Team Standup",     dayIndex: 0, startMins: 9 * 60,        endMins: 9 * 60 + 30,   color: "#3b82f6", isFixed: true },
  { id: "fa5", title: "Team Standup",     dayIndex: 1, startMins: 9 * 60,        endMins: 9 * 60 + 30,   color: "#3b82f6", isFixed: true },
  { id: "fa6", title: "Team Standup",     dayIndex: 2, startMins: 9 * 60,        endMins: 9 * 60 + 30,   color: "#3b82f6", isFixed: true },
  { id: "fa7", title: "Team Standup",     dayIndex: 3, startMins: 9 * 60,        endMins: 9 * 60 + 30,   color: "#3b82f6", isFixed: true },
  { id: "fa8", title: "Team Standup",     dayIndex: 4, startMins: 9 * 60,        endMins: 9 * 60 + 30,   color: "#3b82f6", isFixed: true },
  // Scheduled tasks
  { id: "t1",  title: "Deep Work: Q2 Report",   dayIndex: 0, startMins: 10 * 60,       endMins: 12 * 60,       color: "#B13BFF", linkLabel: "Professional — Complete quarterly project milestone" },
  { id: "t2",  title: "Mentor Session",          dayIndex: 1, startMins: 14 * 60,       endMins: 15 * 60,       color: "#B13BFF", linkLabel: "Professional — Mentor junior team member", isDailyPriority: true },
  { id: "t3",  title: "5km Run",                 dayIndex: 2, startMins: 17 * 60,       endMins: 18 * 60,       color: "#22c55e", linkLabel: "Health — Run 5km three times this week" },
  { id: "t4",  title: "Morning Meditation",      dayIndex: 3, startMins: 6 * 60 + 30,  endMins: 7 * 60,        color: "#B13BFF", linkLabel: "Spiritual — Morning meditation" },
  { id: "t5",  title: "Read: Atomic Habits",     dayIndex: 3, startMins: 20 * 60,       endMins: 20 * 60 + 45, color: "#14b8a6", linkLabel: "Mental — Read for 30 minutes", isDailyPriority: true },
  { id: "t6",  title: "Family Dinner",           dayIndex: 4, startMins: 18 * 60 + 30, endMins: 20 * 60,       color: "#FFCC00", linkLabel: "Parent — Plan weekend family activity" },
  { id: "t7",  title: "Meal Prep",               dayIndex: 6, startMins: 11 * 60,       endMins: 13 * 60,       color: "#22c55e", linkLabel: "Health — Meal prep on Sunday" },
  { id: "t8",  title: "Weekly Review",           dayIndex: 6, startMins: 16 * 60,       endMins: 17 * 60,       color: "#f97316", linkLabel: "Physical — Stretching routine" },
]
