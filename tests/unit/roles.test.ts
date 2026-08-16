import { describe, it, expect } from "vitest"
import {
  ROLE_ICON_BY_ID,
  FALLBACK_ROLE_ICON,
  getColor,
  countGoals,
} from "@/app/roles/_utils/roles"
import { ROLE_COLORS, ROLE_ICONS, MAX_RECOMMENDED_GOALS } from "@/app/roles/_constants/roles"
import { INITIAL_ROLES } from "@/app/roles/_constants/mock-data"
import type { Role } from "@/app/roles/_types"

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
})

describe("countGoals", () => {
  it("sums goals across all roles", () => {
    expect(countGoals(INITIAL_ROLES)).toBe(3)
  })

  it("is 0 for no roles and for roles without goals", () => {
    expect(countGoals([])).toBe(0)
    const empty: Role[] = [{ id: "1", name: "Solo", iconId: "users", colorId: "primary", goals: [] }]
    expect(countGoals(empty)).toBe(0)
  })

  it("starts below the warning threshold", () => {
    expect(countGoals(INITIAL_ROLES)).toBeLessThan(MAX_RECOMMENDED_GOALS)
  })
})
