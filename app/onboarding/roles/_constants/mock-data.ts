import type { Role } from "../_types"

export const INITIAL_ROLES: Role[] = [
  {
    id: "1",
    name: "Professional",
    iconId: "briefcase",
    colorId: "primary",
    goals: [
      { id: "g1", text: "Complete quarterly project milestone" },
      { id: "g2", text: "Mentor junior team member" },
    ],
  },
  {
    id: "2",
    name: "Parent",
    iconId: "users",
    colorId: "teal",
    goals: [
      { id: "g3", text: "Plan weekend family activity" },
    ],
  },
]
