import { describe, it, expect } from "vitest"
import { getLinkMeta } from "@/app/weekly-plan/schedule/_utils/tasks"
import { MOCK_DIMENSIONS, MOCK_ROLES } from "@/app/weekly-plan/_constants/mock-data"

const base = {
  selectedRoleId: "",
  selectedGoalId: "",
  selectedDimensionId: "",
  selectedActivityId: "",
}

describe("getLinkMeta", () => {
  it("returns the role colour and a 'Role — Goal' label", () => {
    expect(
      getLinkMeta({ ...base, linkType: "role-goal", selectedRoleId: "r1", selectedGoalId: "g1" })
    ).toEqual({ color: "#B13BFF", label: "Professional — Complete quarterly project milestone" })
  })

  it("returns the dimension colour and a 'Dimension — Activity' label", () => {
    expect(
      getLinkMeta({
        ...base,
        linkType: "sharpen-the-saw",
        selectedDimensionId: "physical",
        selectedActivityId: "a1",
      })
    ).toEqual({ color: "#f97316", label: "Physical — 30-minute jog" })
  })

  it("is null until a goal is chosen, which is what disables Save", () => {
    expect(getLinkMeta({ ...base, linkType: "role-goal", selectedRoleId: "r1" })).toBeNull()
    expect(getLinkMeta({ ...base, linkType: "role-goal" })).toBeNull()
  })

  it("is null until an activity is chosen", () => {
    expect(
      getLinkMeta({ ...base, linkType: "sharpen-the-saw", selectedDimensionId: "physical" })
    ).toBeNull()
  })

  it("is null when the goal does not belong to the selected role", () => {
    // g1 belongs to r1, not r2
    expect(
      getLinkMeta({ ...base, linkType: "role-goal", selectedRoleId: "r2", selectedGoalId: "g1" })
    ).toBeNull()
  })
})

describe("weekly-plan shared mock data", () => {
  it("is reachable from the flow-level _constants folder", () => {
    expect(MOCK_ROLES.map(r => r.id)).toEqual(["r1", "r2", "r3"])
    expect(MOCK_DIMENSIONS.map(d => d.id)).toEqual(["physical", "spiritual", "mental", "social"])
  })

  it("gives every role at least one goal and every dimension at least one activity", () => {
    expect(MOCK_ROLES.every(r => r.goals.length > 0)).toBe(true)
    expect(MOCK_DIMENSIONS.every(d => d.activities.length > 0)).toBe(true)
  })

  it("uses globally unique goal and activity ids", () => {
    const goalIds = MOCK_ROLES.flatMap(r => r.goals.map(g => g.id))
    const actIds = MOCK_DIMENSIONS.flatMap(d => d.activities.map(a => a.id))
    expect(new Set(goalIds).size).toBe(goalIds.length)
    expect(new Set(actIds).size).toBe(actIds.length)
  })
})
