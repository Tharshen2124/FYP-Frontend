import { CATEGORIES, PARENT_IDS } from "../_constants/categories"
import { type CalSettings } from "../_types"

export function childrenOf(parentId: string) {
  return CATEGORIES.filter(c => c.parentId === parentId)
}

export function allDescendantIds(parentId: string) {
  return CATEGORIES.filter(c => c.parentId === parentId).map(c => c.id)
}

export function settingsEqual(a: CalSettings, b: CalSettings) {
  if (a.allowSync !== b.allowSync) return false
  if (a.exportIds.size !== b.exportIds.size) return false
  for (const id of a.exportIds) if (!b.exportIds.has(id)) return false
  return true
}

export function isChecked(id: string, exportIds: Set<string>) {
  if (PARENT_IDS.has(id)) {
    const children = allDescendantIds(id)
    return children.length > 0 && children.every(cid => exportIds.has(cid))
  }
  return exportIds.has(id)
}

export function isIndeterminate(id: string, exportIds: Set<string>) {
  if (!PARENT_IDS.has(id)) return false
  const children = allDescendantIds(id)
  const checked = children.filter(cid => exportIds.has(cid)).length
  return checked > 0 && checked < children.length
}

export function toggleCategory(id: string, exportIds: Set<string>): Set<string> {
  const next = new Set(exportIds)
  if (PARENT_IDS.has(id)) {
    const children = allDescendantIds(id)
    const allOn = children.every(cid => next.has(cid))
    children.forEach(cid => (allOn ? next.delete(cid) : next.add(cid)))
  } else {
    next.has(id) ? next.delete(id) : next.add(id)
  }
  return next
}
