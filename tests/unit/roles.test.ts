import { describe, it, expect } from "vitest"
import {
  ROLE_ICON_BY_ID,
  FALLBACK_ROLE_ICON,
  getColor,
  countGoals,
} from "@/app/roles/_utils/roles"
import { ROLE_COLORS, ROLE_ICONS, MAX_RECOMMENDED_GOALS } from "@/app/roles/_constants/roles"
import { WEEKLY_PRIORITY_COLOR } from "@/lib/role-colors"
import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import type { Role } from "@/app/roles/_types"

// The page loads its roles from the API, so these are fixtures rather than page seed data.
const ROLES: Role[] = [
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
  { id: "2", name: "Parent", iconId: "users", colorId: "teal", goals: [{ id: "g3", text: "Plan weekend family activity" }] },
]

describe("role icon lookup", () => {
  it("exposes every catalogue icon by id", () => {
    for (const entry of ROLE_ICONS) {
      expect(ROLE_ICON_BY_ID[entry.id]).toBe(entry.icon)
    }
  })

  it("falls back for an unknown id", () => {
    expect(ROLE_ICON_BY_ID["nope"] ?? FALLBACK_ROLE_ICON).toBe(FALLBACK_ROLE_ICON)
  })
})

describe("getColor", () => {
  it("resolves every catalogue colour", () => {
    for (const c of ROLE_COLORS) expect(getColor(c.id)).toBe(c.value)
  })

  it("falls back to the primary colour for an unknown id", () => {
    expect(getColor("nope")).toBe("#B13BFF")
  })

  /* "accent" was this palette's yellow. A migration reassigned every stored row, but a client
     holding a stale role must still not paint it yellow — that colour now means something else. */
  it("does not resolve the retired yellow id", () => {
    expect(getColor("accent")).toBe("#B13BFF")
  })
})

/**
 * Yellow means one thing on a schedule: this task serves a goal the user named a weekly priority.
 * That only holds while nothing *else* a calendar tints a task by can claim it — so both palettes
 * are checked here rather than each trusting the other to stay clear.
 */
describe("the reserved yellow", () => {
  it("is offered by no role colour", () => {
    expect(ROLE_COLORS.map(c => c.value)).not.toContain(WEEKLY_PRIORITY_COLOR)
    expect(ROLE_COLORS.map(c => c.id)).not.toContain("accent")
  })

  it("is used by no Sharpen the Saw dimension", () => {
    expect(SHARPEN_THE_SAW_DIMENSIONS.map(d => d.color)).not.toContain(WEEKLY_PRIORITY_COLOR)
  })
})

describe("countGoals", () => {
  it("sums goals across all roles", () => {
    expect(countGoals(ROLES)).toBe(3)
  })

  it("is 0 for no roles and for roles without goals", () => {
    expect(countGoals([])).toBe(0)
    const empty: Role[] = [{ id: "1", name: "Solo", iconId: "users", colorId: "primary", goals: [] }]
    expect(countGoals(empty)).toBe(0)
  })

  it("starts below the warning threshold", () => {
    expect(countGoals(ROLES)).toBeLessThan(MAX_RECOMMENDED_GOALS)
  })
})
