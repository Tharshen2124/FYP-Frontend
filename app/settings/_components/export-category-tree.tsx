"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import { TOP_LEVEL_ORDER } from "../_constants/categories"
import { childrenOf, isChecked, isIndeterminate, parentIds, topLevel } from "../_utils/categories"
import type { CategoryItem } from "../_types"

interface Props {
  categories: CategoryItem[]
  exportIds: Set<string>
  expanded: Set<string>
  onToggleCategory: (id: string) => void
  onToggleExpanded: (id: string) => void
}

export function ExportCategoryTree({ categories, exportIds, expanded, onToggleCategory, onToggleExpanded }: Props) {
  const parents = parentIds(categories)
  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border">
      <h3 className="text-lg font-bold text-foreground mb-1">Export Categories</h3>
      <p className="text-sm text-muted-foreground font-serif mb-5">
        Choose which items from HabitFlow are exported to your Google Calendar.
      </p>

      <div className="space-y-2">
        {topLevel(categories, TOP_LEVEL_ORDER).map(cat => {
          const hasChildren = parents.has(cat.id)
          const isOpen = expanded.has(cat.id)
          const children = hasChildren ? childrenOf(categories, cat.id) : []
          const checked = isChecked(categories, exportIds, cat.id)
          const indeterminate = isIndeterminate(categories, exportIds, cat.id)

          return (
            <div key={cat.id}>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/10 transition-colors">
                <button
                  role="checkbox"
                  aria-checked={indeterminate ? "mixed" : checked}
                  aria-label={cat.label}
                  onClick={() => onToggleCategory(cat.id)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    checked ? "bg-primary border-primary" : indeterminate ? "bg-primary/40 border-primary/60" : "bg-muted border-border hover:border-primary/60"
                  }`}
                >
                  {(checked || indeterminate) && (
                    <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-none stroke-current stroke-2">
                      {indeterminate ? <line x1="2" y1="6" x2="10" y2="6" /> : <polyline points="2,6 5,9 10,3" />}
                    </svg>
                  )}
                </button>
                <span className="flex-1 font-semibold text-foreground cursor-pointer select-none" onClick={() => onToggleCategory(cat.id)}>
                  {cat.label}
                </span>
                {hasChildren && (
                  <button
                    onClick={() => onToggleExpanded(cat.id)}
                    aria-label={`${isOpen ? "Collapse" : "Expand"} ${cat.label}`}
                    className="p-1 rounded-lg hover:bg-secondary/20 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {hasChildren && isOpen && children.length === 0 && (
                <div className="ml-8 mt-1 mb-2 border-l-2 border-border pl-4 py-2">
                  <p className="text-sm text-muted-foreground font-serif">
                    No roles yet — add one on the Roles page and its tasks will export automatically.
                  </p>
                </div>
              )}

              {hasChildren && isOpen && children.length > 0 && (
                <div className="ml-8 mt-1 mb-2 space-y-1 border-l-2 border-border pl-4">
                  {children.map(child => {
                    const childChecked = exportIds.has(child.id)
                    return (
                      <button
                        key={child.id}
                        onClick={() => onToggleCategory(child.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary/10 transition-colors text-left"
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${childChecked ? "bg-primary border-primary" : "bg-muted border-border hover:border-primary/60"}`}>
                          {childChecked && (
                            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white fill-none stroke-current stroke-2">
                              <polyline points="2,6 5,9 10,3" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground font-serif">{child.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
