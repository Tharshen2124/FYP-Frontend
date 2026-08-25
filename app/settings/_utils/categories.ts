import { FIXED_ID } from "../_constants/categories"
import type { ApiExportPreference } from "@/lib/api"
import type { CalSettings, CategoryItem } from "../_types"

/**
 * Every function here takes the category list rather than closing over a constant: with real roles
 * the tree is fetched, so there is no module-level list to close over any more.
 */
export function childrenOf(categories: CategoryItem[], parentId: string) {
  return categories.filter(c => c.parentId === parentId)
}

export function allDescendantIds(categories: CategoryItem[], parentId: string): string[] {
  return childrenOf(categories, parentId).map(c => c.id)
}

export function parentIds(categories: CategoryItem[]): Set<string> {
  return new Set(categories.filter(c => c.parentId).map(c => c.parentId!))
}

export function topLevel(categories: CategoryItem[], order: string[]): CategoryItem[] {
  return order.map(id => categories.find(c => c.id === id)).filter((c): c is CategoryItem => !!c)
}

export function settingsEqual(a: CalSettings, b: CalSettings): boolean {
  if (a.allowSync !== b.allowSync) return false
  if (a.exportIds.size !== b.exportIds.size) return false
  for (const id of a.exportIds) if (!b.exportIds.has(id)) return false
  return true
}

/** A parent is checked only when all of its children are. */
export function isChecked(categories: CategoryItem[], exportIds: Set<string>, id: string): boolean {
  if (!parentIds(categories).has(id)) return exportIds.has(id)
  const children = allDescendantIds(categories, id)
  return children.length > 0 && children.every(cid => exportIds.has(cid))
}

/** A parent is indeterminate when only some of its children are checked. */
export function isIndeterminate(categories: CategoryItem[], exportIds: Set<string>, id: string): boolean {
  if (!parentIds(categories).has(id)) return false
  const children = allDescendantIds(categories, id)
  const checked = children.filter(cid => exportIds.has(cid)).length
  return checked > 0 && checked < children.length
}

/** Toggling a parent switches all of its children together. */
export function toggleCategoryIds(
  categories: CategoryItem[],
  exportIds: Set<string>,
  id: string
): Set<string> {
  const next = new Set(exportIds)
  if (parentIds(categories).has(id)) {
    const children = allDescendantIds(categories, id)
    const allOn = children.every(cid => next.has(cid))
    children.forEach(cid => (allOn ? next.delete(cid) : next.add(cid)))
  } else if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  return next
}

/** Everything leaf-level is exported by default. */
export function defaultExportIds(categories: CategoryItem[]): Set<string> {
  const parents = parentIds(categories)
  return new Set(categories.filter(c => !parents.has(c.id)).map(c => c.id))
}

/**
 * The tree, as the exclusion list the server stores.
 *
 * The inversion happens only here, at the boundary. The checkbox logic above stays in terms of
 * what is ticked — which is what a user is choosing — and never learns that the column records the
 * opposite.
 */
export function toApiPreference(
  categories: CategoryItem[],
  exportIds: Set<string>
): ApiExportPreference {
  return {
    fixed_appointments: exportIds.has(FIXED_ID),
    excluded_dimensions: categories
      .filter(c => c.dimensionId && !exportIds.has(c.id))
      .map(c => c.dimensionId!),
    excluded_role_ids: categories
      .filter(c => c.roleId !== undefined && !exportIds.has(c.id))
      .map(c => c.roleId!),
  }
}

/**
 * The stored exclusions, as the ticked tree.
 *
 * A role the preference has never heard of comes back ticked, which is the whole point of storing
 * exclusions: add a role today and its tasks are on the calendar without a second visit here.
 */
export function fromApiPreference(
  categories: CategoryItem[],
  preference: ApiExportPreference
): Set<string> {
  const excludedDimensions = new Set(preference.excluded_dimensions)
  const excludedRoles = new Set(preference.excluded_role_ids)
  const parents = parentIds(categories)

  return new Set(
    categories
      .filter(c => {
        if (parents.has(c.id)) return false
        if (c.id === FIXED_ID) return preference.fixed_appointments
        if (c.dimensionId) return !excludedDimensions.has(c.dimensionId)
        if (c.roleId !== undefined) return !excludedRoles.has(c.roleId)
        return true
      })
      .map(c => c.id)
  )
}
