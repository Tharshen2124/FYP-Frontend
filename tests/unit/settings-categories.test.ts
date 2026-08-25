import { describe, it, expect } from "vitest"
import {
  allDescendantIds,
  childrenOf,
  defaultExportIds,
  fromApiPreference,
  isChecked,
  isIndeterminate,
  parentIds,
  settingsEqual,
  toApiPreference,
  toggleCategoryIds,
  topLevel,
} from "@/app/settings/_utils/categories"
import {
  buildCategories,
  FIXED_ID,
  ROLES_PARENT_ID,
  STS_PARENT_ID,
  TOP_LEVEL_ORDER,
  roleCategoryId,
} from "@/app/settings/_constants/categories"
import type { ApiRole } from "@/lib/api"

/**
 * The tree is built from the user's real roles now, so the fixture stands in for what the API
 * returns. It used to be four invented names hard-coded in the constants file.
 */
const ROLES = [
  { role_id: 7, name: "Student", icon_id: "book", color_id: "primary", goals: [] },
  { role_id: 12, name: "Programmer", icon_id: "code", color_id: "teal", goals: [] },
] as unknown as ApiRole[]

const CATEGORIES = buildCategories(ROLES)
const ALL_ON = defaultExportIds(CATEGORIES)

describe("category tree shape", () => {
  it("has three top-level entries, two of which have children", () => {
    expect(topLevel(CATEGORIES, TOP_LEVEL_ORDER).map(c => c.id)).toEqual([
      FIXED_ID,
      STS_PARENT_ID,
      ROLES_PARENT_ID,
    ])
    expect([...parentIds(CATEGORIES)].sort()).toEqual([ROLES_PARENT_ID, STS_PARENT_ID])
    expect(childrenOf(CATEGORIES, STS_PARENT_ID)).toHaveLength(4)
    expect(childrenOf(CATEGORIES, FIXED_ID)).toEqual([])
  })

  it("builds one role child per role, keyed on role_id rather than on the name", () => {
    expect(childrenOf(CATEGORIES, ROLES_PARENT_ID).map(c => c.id)).toEqual([
      roleCategoryId(7),
      roleCategoryId(12),
    ])
    expect(childrenOf(CATEGORIES, ROLES_PARENT_ID).map(c => c.label)).toEqual([
      "Student Tasks",
      "Programmer Tasks",
    ])
  })

  it("uses the canonical dimension ids, not a slug of the display label", () => {
    const social = childrenOf(CATEGORIES, STS_PARENT_ID).find(c => c.label === "Social / Emotional")
    expect(social?.id).toBe("saw-social")
    expect(social?.dimensionId).toBe("social")
  })

  it("has no role children when the user has no roles yet", () => {
    expect(childrenOf(buildCategories([]), ROLES_PARENT_ID)).toEqual([])
  })

  it("exports every leaf by default and no parents", () => {
    const parents = parentIds(CATEGORIES)
    const leaves = CATEGORIES.filter(c => !parents.has(c.id)).map(c => c.id)
    expect([...ALL_ON].sort()).toEqual(leaves.sort())
    for (const parent of parents) expect(ALL_ON.has(parent)).toBe(false)
  })
})

describe("checkbox state", () => {
  it("marks a parent checked when all its children are", () => {
    expect(isChecked(CATEGORIES, ALL_ON, STS_PARENT_ID)).toBe(true)
    expect(isIndeterminate(CATEGORIES, ALL_ON, STS_PARENT_ID)).toBe(false)
  })

  it("marks a parent indeterminate when only some children are", () => {
    const partial = new Set(ALL_ON)
    partial.delete("saw-physical")
    expect(isChecked(CATEGORIES, partial, STS_PARENT_ID)).toBe(false)
    expect(isIndeterminate(CATEGORIES, partial, STS_PARENT_ID)).toBe(true)
  })

  it("marks a parent unchecked and determinate when no children are", () => {
    const none = new Set<string>()
    expect(isChecked(CATEGORIES, none, STS_PARENT_ID)).toBe(false)
    expect(isIndeterminate(CATEGORIES, none, STS_PARENT_ID)).toBe(false)
  })

  it("never treats a leaf as indeterminate", () => {
    expect(isIndeterminate(CATEGORIES, ALL_ON, FIXED_ID)).toBe(false)
  })
})

describe("toggleCategoryIds", () => {
  it("toggles a leaf on and off", () => {
    const off = toggleCategoryIds(CATEGORIES, new Set(ALL_ON), FIXED_ID)
    expect(off.has(FIXED_ID)).toBe(false)
    expect(toggleCategoryIds(CATEGORIES, off, FIXED_ID).has(FIXED_ID)).toBe(true)
  })

  it("switches all children off when a fully-checked parent is toggled", () => {
    const next = toggleCategoryIds(CATEGORIES, new Set(ALL_ON), ROLES_PARENT_ID)
    for (const id of allDescendantIds(CATEGORIES, ROLES_PARENT_ID)) expect(next.has(id)).toBe(false)
    expect(next.has("saw-physical")).toBe(true)
  })

  it("switches all children on when a partially-checked parent is toggled", () => {
    const partial = new Set(ALL_ON)
    partial.delete(roleCategoryId(12))
    const next = toggleCategoryIds(CATEGORIES, partial, ROLES_PARENT_ID)
    for (const id of allDescendantIds(CATEGORIES, ROLES_PARENT_ID)) expect(next.has(id)).toBe(true)
  })

  it("does not mutate the input set", () => {
    const original = new Set(ALL_ON)
    const size = original.size
    toggleCategoryIds(CATEGORIES, original, ROLES_PARENT_ID)
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

describe("the exclusion boundary", () => {
  it("sends nothing excluded when everything is ticked", () => {
    expect(toApiPreference(CATEGORIES, ALL_ON)).toEqual({
      fixed_appointments: true,
      excluded_dimensions: [],
      excluded_role_ids: [],
    })
  })

  it("sends the untickeds as exclusions, keyed by id", () => {
    const some = new Set(ALL_ON)
    some.delete(FIXED_ID)
    some.delete("saw-social")
    some.delete(roleCategoryId(12))

    expect(toApiPreference(CATEGORIES, some)).toEqual({
      fixed_appointments: false,
      excluded_dimensions: ["social"],
      excluded_role_ids: [12],
    })
  })

  it("round-trips any selection", () => {
    const some = new Set(ALL_ON)
    some.delete("saw-mental")
    some.delete(roleCategoryId(7))

    expect(fromApiPreference(CATEGORIES, toApiPreference(CATEGORIES, some))).toEqual(some)
  })

  /**
   * The whole reason the column stores exclusions. An inclusion list would leave a role added
   * after the last save silently off the calendar, with nothing on screen to explain it.
   */
  it("ticks a role the stored preference has never heard of", () => {
    const stored = toApiPreference(CATEGORIES, ALL_ON)
    const grown = buildCategories([
      ...ROLES,
      { role_id: 99, name: "Runner", icon_id: "activity", color_id: "rose", goals: [] },
    ] as unknown as ApiRole[])

    expect(fromApiPreference(grown, stored).has(roleCategoryId(99))).toBe(true)
  })

  it("keeps an exclusion for a role that is no longer in the tree", () => {
    const stored = { fixed_appointments: true, excluded_dimensions: [], excluded_role_ids: [404] }

    // The archived role has no checkbox any more, and the others are unaffected by its exclusion.
    expect(fromApiPreference(CATEGORIES, stored)).toEqual(ALL_ON)
  })
})
