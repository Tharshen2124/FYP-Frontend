import { describe, it, expect } from "vitest"
import {
  allDimensionsFilled,
  countActivities,
} from "@/app/onboarding/sharpen-the-saw/_utils/dimensions"
import { INITIAL_DIMENSIONS } from "@/app/onboarding/sharpen-the-saw/_constants/dimensions"
import type { Dimension } from "@/app/onboarding/sharpen-the-saw/_types"

const withActivities = (dims: Dimension[], count: number): Dimension[] =>
  dims.map(d => ({
    ...d,
    activities: Array.from({ length: count }, (_, i) => ({ id: `${d.id}-${i}`, text: `act ${i}` })),
  }))

describe("sharpen-the-saw gating", () => {
  it("ships with the four renewal dimensions and no activities", () => {
    expect(INITIAL_DIMENSIONS.map(d => d.id)).toEqual(["physical", "spiritual", "mental", "social"])
    expect(countActivities(INITIAL_DIMENSIONS)).toBe(0)
  })

  it("blocks Next until every dimension has at least one activity", () => {
    expect(allDimensionsFilled(INITIAL_DIMENSIONS)).toBe(false)

    const partial = [...withActivities(INITIAL_DIMENSIONS.slice(0, 3), 1), INITIAL_DIMENSIONS[3]]
    expect(allDimensionsFilled(partial)).toBe(false)

    expect(allDimensionsFilled(withActivities(INITIAL_DIMENSIONS, 1))).toBe(true)
  })

  it("counts activities across all dimensions", () => {
    expect(countActivities(withActivities(INITIAL_DIMENSIONS, 2))).toBe(8)
  })
})
