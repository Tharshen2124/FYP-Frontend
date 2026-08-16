import { CATEGORIES, PARENT_IDS } from "../_constants/categories"
import type { CalSettings } from "../_types"

export function childrenOf(parentId: string) {
  return CATEGORIES.filter(c => c.parentId === parentId)
}

export function allDescendantIds(parentId: string): string[] {
  return childrenOf(parentId).map(c => c.id)
}

export function settingsEqual(a: CalSettings, b: CalSettings): boolean {
  if (a.allowSync !== b.allowSync) return false
  if (a.exportIds.size !== b.exportIds.size) return false
  for (const id of a.exportIds) if (!b.exportIds.has(id)) return false
  return true
}

/** A parent is checked only when all of its children are. */
export function isChecked(exportIds: Set<string>, id: string): boolean {
  if (!PARENT_IDS.has(id)) return exportIds.has(id)
  const children = allDescendantIds(id)
  return children.length > 0 && children.every(cid => exportIds.has(cid))
}

/** A parent is indeterminate when only some of its children are checked. */
export function isIndeterminate(exportIds: Set<string>, id: string): boolean {
  if (!PARENT_IDS.has(id)) return false
  const children = allDescendantIds(id)
  const checked = children.filter(cid => exportIds.has(cid)).length
  return checked > 0 && checked < children.length
}

/** Toggling a parent switches all of its children together. */
export function toggleCategoryIds(exportIds: Set<string>, id: string): Set<string> {
  const next = new Set(exportIds)
  if (PARENT_IDS.has(id)) {
    const children = allDescendantIds(id)
    const allOn = children.every(cid => next.has(cid))
    children.forEach(cid => (allOn ? next.delete(cid) : next.add(cid)))
  } else if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  return next
}
