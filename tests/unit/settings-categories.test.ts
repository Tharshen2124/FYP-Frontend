import { describe, it, expect } from "vitest"
import {
  allDescendantIds,
  childrenOf,
  isChecked,
  isIndeterminate,
  settingsEqual,
  toggleCategoryIds,
} from "@/app/settings/_utils/categories"
import {
  CATEGORIES,
  DEFAULT_CAL_SETTINGS,
  PARENT_IDS,
  TOP_LEVEL,
} from "@/app/settings/_constants/categories"

describe("category tree shape", () => {
  it("has three top-level entries, two of which have children", () => {
    expect(TOP_LEVEL.map(c => c.id)).toEqual(["fixed-appointments", "sharpen-the-saw", "role-tasks"])
    expect([...PARENT_IDS].sort()).toEqual(["role-tasks", "sharpen-the-saw"])
    expect(childrenOf("sharpen-the-saw")).toHaveLength(4)
    expect(childrenOf("role-tasks")).toHaveLength(4)
    expect(childrenOf("fixed-appointments")).toEqual([])
  })

  it("slugifies dimension labels containing a slash", () => {
    expect(allDescendantIds("sharpen-the-saw")).toContain("saw-social-emotional")
  })

  it("exports every leaf by default and no parents", () => {
    const leaves = CATEGORIES.filter(c => !PARENT_IDS.has(c.id)).map(c => c.id)
    expect([...DEFAULT_CAL_SETTINGS.exportIds].sort()).toEqual(leaves.sort())
    for (const parent of PARENT_IDS) {
      expect(DEFAULT_CAL_SETTINGS.exportIds.has(parent)).toBe(false)
    }
  })
})

describe("checkbox state", () => {
  const allOn = new Set(DEFAULT_CAL_SETTINGS.exportIds)

  it("marks a parent checked when all its children are", () => {
    expect(isChecked(allOn, "sharpen-the-saw")).toBe(true)
    expect(isIndeterminate(allOn, "sharpen-the-saw")).toBe(false)
  })

  it("marks a parent indeterminate when only some children are", () => {
    const partial = new Set(allOn)
    partial.delete("saw-physical")
    expect(isChecked(partial, "sharpen-the-saw")).toBe(false)
    expect(isIndeterminate(partial, "sharpen-the-saw")).toBe(true)
  })

  it("marks a parent unchecked and determinate when no children are", () => {
    const none = new Set<string>()
    expect(isChecked(none, "sharpen-the-saw")).toBe(false)
    expect(isIndeterminate(none, "sharpen-the-saw")).toBe(false)
  })

  it("never treats a leaf as indeterminate", () => {
    expect(isIndeterminate(allOn, "fixed-appointments")).toBe(false)
  })
})

describe("toggleCategoryIds", () => {
  it("toggles a leaf on and off", () => {
    const off = toggleCategoryIds(new Set(DEFAULT_CAL_SETTINGS.exportIds), "fixed-appointments")
    expect(off.has("fixed-appointments")).toBe(false)
    expect(toggleCategoryIds(off, "fixed-appointments").has("fixed-appointments")).toBe(true)
  })

  it("switches all children off when a fully-checked parent is toggled", () => {
    const next = toggleCategoryIds(new Set(DEFAULT_CAL_SETTINGS.exportIds), "role-tasks")
    for (const id of allDescendantIds("role-tasks")) expect(next.has(id)).toBe(false)
    // other branches are untouched
    expect(next.has("saw-physical")).toBe(true)
  })

  it("switches all children on when a partially-checked parent is toggled", () => {
    const partial = new Set(DEFAULT_CAL_SETTINGS.exportIds)
    partial.delete("role-programmer")
    const next = toggleCategoryIds(partial, "role-tasks")
    for (const id of allDescendantIds("role-tasks")) expect(next.has(id)).toBe(true)
  })

  it("does not mutate the input set", () => {
    const original = new Set(DEFAULT_CAL_SETTINGS.exportIds)
    const size = original.size
    toggleCategoryIds(original, "role-tasks")
    expect(original.size).toBe(size)
  })
})

describe("settingsEqual (drives the sticky Save bar)", () => {
  const base = { allowSync: true, exportIds: new Set(["a", "b"]) }

  it("is true for an identical copy", () => {
    expect(settingsEqual(base, { allowSync: true, exportIds: new Set(["b", "a"]) })).toBe(true)
  })

  it("is false when the sync toggle differs", () => {
    expect(settingsEqual(base, { allowSync: false, exportIds: new Set(["a", "b"]) })).toBe(false)
  })

  it("is false when the export selection differs", () => {
    expect(settingsEqual(base, { allowSync: true, exportIds: new Set(["a"]) })).toBe(false)
    expect(settingsEqual(base, { allowSync: true, exportIds: new Set(["a", "c"]) })).toBe(false)
  })
})
