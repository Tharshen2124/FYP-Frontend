import { describe, it, expect } from "vitest"
import { SHARPEN_THE_SAW_DIMENSIONS } from "@/lib/sharpen-the-saw-dimensions"
import { INITIAL_DIMENSIONS } from "@/app/sharpen-the-saw/_constants/dimensions"
import { groupActivitiesByDimension } from "@/app/sharpen-the-saw/_utils/dimensions"

describe("shared sharpen-the-saw dimension metadata", () => {
  it("defines exactly the four Sharpen the Saw dimensions in order", () => {
    expect(SHARPEN_THE_SAW_DIMENSIONS.map(d => d.id)).toEqual(["physical", "spiritual", "mental", "social"])
  })

  it("standing page's INITIAL_DIMENSIONS derives its ids and labels from the shared source", () => {
    expect(INITIAL_DIMENSIONS.map(d => d.id)).toEqual(SHARPEN_THE_SAW_DIMENSIONS.map(d => d.id))
    expect(INITIAL_DIMENSIONS.map(d => d.label)).toEqual(SHARPEN_THE_SAW_DIMENSIONS.map(d => d.label))
    expect(INITIAL_DIMENSIONS.every(d => d.activities.length === 0)).toBe(true)
  })

  it("groups fetched activities under their matching dimension", () => {
    const grouped = groupActivitiesByDimension([
      { sharpen_the_saw_activity_id: 1, dimension: "physical", activity_description: "Morning run" },
      { sharpen_the_saw_activity_id: 2, dimension: "social", activity_description: "Call a friend" },
    ])

    expect(grouped.find(d => d.id === "physical")?.activities).toEqual([{ id: "1", text: "Morning run" }])
    expect(grouped.find(d => d.id === "social")?.activities).toEqual([{ id: "2", text: "Call a friend" }])
    expect(grouped.find(d => d.id === "mental")?.activities).toEqual([])
  })
})
