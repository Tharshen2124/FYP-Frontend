import { describe, it, expect } from "vitest"
import {
  allDimensionsFilled,
  countActivities,
} from "@/app/onboarding/sharpen-the-saw/_utils/dimensions"
import { INITIAL_DIMENSIONS } from "@/app/onboarding/sharpen-the-saw/_constants/dimensions"
import { toPlanDimensions } from "@/app/weekly-plan/_utils/dimensions"
import type { Dimension } from "@/app/onboarding/sharpen-the-saw/_types"
import type { PlanDimension } from "@/app/weekly-plan/_types"

const withActivities = (dims: Dimension[], count: number): Dimension[] =>
  dims.map(d => ({
    ...d,
    activities: Array.from({ length: count }, (_, i) => ({ id: `${d.id}-${i}`, text: `act ${i}` })),
  }))

describe("sharpen-the-saw gating", () => {
  it("ships with the four Sharpen the Saw dimensions and no activities", () => {
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

/**
 * The library is standing and belongs to the user; the committed set belongs to one week. Which of
 * the two the link picker offers is `ActivitySource`, and it is the difference between the wizard's
 * schedule step and `/weekly-plan/edit`.
 */
describe("toPlanDimensions", () => {
  const ACTIVITIES = [
    { sharpen_the_saw_activity_id: 13, dimension: "physical", activity_description: "Go to the gym" },
    { sharpen_the_saw_activity_id: 14, dimension: "spiritual", activity_description: "Pray once a day" },
    { sharpen_the_saw_activity_id: 3176, dimension: "physical", activity_description: "Go for a run" },
  ]

  const byId = (dims: PlanDimension[], id: string) => dims.find(d => d.id === id)!

  it("groups the whole library under the four dimensions when no set is given", () => {
    const dims = toPlanDimensions(ACTIVITIES)
    expect(dims.map(d => d.id)).toEqual(["physical", "spiritual", "mental", "social"])
    expect(byId(dims, "physical").activities.map(a => a.text)).toEqual(["Go to the gym", "Go for a run"])
    expect(byId(dims, "mental").activities).toEqual([])
  })

  it("keeps only the week's committed activities when a set is given", () => {
    const dims = toPlanDimensions(ACTIVITIES, new Set(["14"]))
    expect(byId(dims, "physical").activities).toEqual([])
    expect(byId(dims, "spiritual").activities.map(a => a.id)).toEqual(["14"])
  })

  /* The bug this distinction was written for: an activity added on /sharpen-the-saw after the week
     was planned is committed to no week, so the committed view cannot offer it — and on
     /weekly-plan/edit there is no step left that could commit it. That page asks for the library. */
  it("offers an activity the week never committed to, once the library is what is asked for", () => {
    const committed = toPlanDimensions(ACTIVITIES, new Set(["14"]))
    const library = toPlanDimensions(ACTIVITIES)

    expect(byId(committed, "physical").activities.map(a => a.id)).not.toContain("3176")
    expect(byId(library, "physical").activities.map(a => a.id)).toContain("3176")
  })
})
