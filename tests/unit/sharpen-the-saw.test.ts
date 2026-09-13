import { describe, it, expect } from "vitest"
import {
  allDimensionsFilled,
  countActivities,
} from "@/app/onboarding/sharpen-the-saw/_utils/dimensions"
import { INITIAL_DIMENSIONS } from "@/app/onboarding/sharpen-the-saw/_constants/dimensions"
import { toPlanDimensions } from "@/app/weekly-plan/_utils/dimensions"
import {
  dimensionsMissingSelection,
  formatDimensionList,
} from "@/app/weekly-plan/sharpen-the-saw/_utils/dimensions"
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

/**
 * The weekly step asks for what onboarding asks for: a selection in each of the four dimensions.
 * It used to unlock on one activity anywhere, which made the weekly bar the looser of the two for
 * the same four-dimension framework.
 */
describe("dimensionsMissingSelection", () => {
  const dims = toPlanDimensions([
    { sharpen_the_saw_activity_id: 1, dimension: "physical", activity_description: "Gym" },
    { sharpen_the_saw_activity_id: 2, dimension: "spiritual", activity_description: "Pray" },
    { sharpen_the_saw_activity_id: 3, dimension: "mental", activity_description: "Read" },
    { sharpen_the_saw_activity_id: 4, dimension: "social", activity_description: "Call a friend" },
  ])

  it("names every dimension when nothing is selected", () => {
    expect(dimensionsMissingSelection(dims, new Set()).map(d => d.id)).toEqual([
      "physical", "spiritual", "mental", "social",
    ])
  })

  it("keeps naming the rest when only one dimension is covered", () => {
    expect(dimensionsMissingSelection(dims, new Set(["1"])).map(d => d.id)).toEqual([
      "spiritual", "mental", "social",
    ])
  })

  it("names none once every dimension has a selection", () => {
    expect(dimensionsMissingSelection(dims, new Set(["1", "2", "3", "4"]))).toEqual([])
  })

  /* Two activities in one dimension is still one dimension covered — the requirement is per
     dimension, not a count. */
  it("does not let a second activity in one dimension cover another", () => {
    const library = toPlanDimensions([
      { sharpen_the_saw_activity_id: 1, dimension: "physical", activity_description: "Gym" },
      { sharpen_the_saw_activity_id: 5, dimension: "physical", activity_description: "Run" },
    ])
    expect(dimensionsMissingSelection(library, new Set(["1", "5"])).map(d => d.id)).toEqual([
      "spiritual", "mental", "social",
    ])
  })

  /* A dimension the user has emptied on /sharpen-the-saw has nothing to select, which is why the
     step offers an add field per dimension rather than only a picker. */
  it("names a dimension whose library is empty", () => {
    const library = toPlanDimensions([
      { sharpen_the_saw_activity_id: 1, dimension: "physical", activity_description: "Gym" },
    ])
    expect(dimensionsMissingSelection(library, new Set(["1"])).map(d => d.id)).toContain("mental")
  })
})

describe("formatDimensionList", () => {
  const dims = toPlanDimensions([])
  const pick = (...ids: string[]) => dims.filter(d => ids.includes(d.id))

  it("reads as a sentence for one, two and more", () => {
    expect(formatDimensionList(pick("physical"))).toBe("Physical")
    expect(formatDimensionList(pick("physical", "mental"))).toBe("Physical and Mental")
    expect(formatDimensionList(pick("physical", "mental", "social")))
      .toBe("Physical, Mental and Social / Emotional")
  })

  it("is empty when nothing is missing", () => {
    expect(formatDimensionList([])).toBe("")
  })
})
