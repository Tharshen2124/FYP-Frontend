import { Flame, Brain, Users, Sparkles } from "lucide-react"
import type { FixedAppt, MockRole, MockDimension } from "../_types"

export const MOCK_FIXED: FixedAppt[] = [
  { id: "fa1", title: "Morning Workout", dayIndex: 0, startMins: 7 * 60, endMins: 8 * 60 },
  { id: "fa2", title: "Morning Workout", dayIndex: 2, startMins: 7 * 60, endMins: 8 * 60 },
  { id: "fa3", title: "Morning Workout", dayIndex: 4, startMins: 7 * 60, endMins: 8 * 60 },
  { id: "fa4", title: "Team Standup",    dayIndex: 0, startMins: 9 * 60, endMins: 9 * 60 + 30 },
  { id: "fa5", title: "Team Standup",    dayIndex: 1, startMins: 9 * 60, endMins: 9 * 60 + 30 },
  { id: "fa6", title: "Team Standup",    dayIndex: 2, startMins: 9 * 60, endMins: 9 * 60 + 30 },
  { id: "fa7", title: "Team Standup",    dayIndex: 3, startMins: 9 * 60, endMins: 9 * 60 + 30 },
  { id: "fa8", title: "Team Standup",    dayIndex: 4, startMins: 9 * 60, endMins: 9 * 60 + 30 },
]

export const MOCK_ROLES: MockRole[] = [
  {
    id: "r1", name: "Professional", color: "#B13BFF",
    goals: [
      { id: "g1", text: "Complete quarterly project milestone" },
      { id: "g2", text: "Mentor junior team member" },
    ],
  },
  {
    id: "r2", name: "Parent", color: "#FFCC00",
    goals: [
      { id: "g3", text: "Plan weekend family activity" },
    ],
  },
  {
    id: "r3", name: "Health", color: "#22c55e",
    goals: [
      { id: "g4", text: "Run 5km three times this week" },
      { id: "g5", text: "Meal prep on Sunday" },
    ],
  },
]

export const MOCK_DIMENSIONS: MockDimension[] = [
  {
    id: "physical", label: "Physical", color: "#f97316", icon: Flame,
    activities: [
      { id: "a1", text: "30-minute jog" },
      { id: "a2", text: "Stretching routine" },
    ],
  },
  {
    id: "spiritual", label: "Spiritual", color: "#B13BFF", icon: Sparkles,
    activities: [
      { id: "a3", text: "Morning meditation" },
      { id: "a4", text: "Journal reflection" },
    ],
  },
  {
    id: "mental", label: "Mental", color: "#14b8a6", icon: Brain,
    activities: [
      { id: "a5", text: "Read for 30 minutes" },
      { id: "a6", text: "Online course chapter" },
    ],
  },
  {
    id: "social", label: "Social", color: "#FFCC00", icon: Users,
    activities: [
      { id: "a7", text: "Call a friend" },
      { id: "a8", text: "Family dinner" },
    ],
  },
]
