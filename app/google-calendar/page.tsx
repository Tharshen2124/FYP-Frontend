"use client"

import { useState } from "react"
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Link2,
  Link2Off,
  RotateCcw,
  Save,
} from "lucide-react"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// ─── Types ───────────────────────────────────────────────────────────────────

interface CategoryItem {
  id: string
  label: string
  parentId?: string
}

interface Settings {
  allowSync: boolean
  exportIds: Set<string>
}

// ─── Data ────────────────────────────────────────────────────────────────────

const MOCK_ROLES = ["Student", "Programmer", "Designer", "Team Lead"]

const SAW_DIMENSIONS = ["Physical", "Spiritual", "Mental", "Social / Emotional"]

const CATEGORIES: CategoryItem[] = [
  { id: "fixed-appointments", label: "Fixed Appointments" },
  { id: "sharpen-the-saw", label: "Sharpen the Saw Activities" },
  ...SAW_DIMENSIONS.map(d => ({
    id: `saw-${d.toLowerCase().replace(/\s*\/\s*/g, "-").replace(/\s+/g, "-")}`,
    label: d,
    parentId: "sharpen-the-saw",
  })),
  ...MOCK_ROLES.map(r => ({
    id: `role-${r.toLowerCase().replace(/\s+/g, "-")}`,
    label: `${r} Tasks`,
    parentId: "role-tasks",
  })),
  { id: "role-tasks", label: "Role Tasks" },
]

// IDs of categories that have children
const PARENT_IDS = new Set(
  CATEGORIES.filter(c => c.parentId).map(c => c.parentId!)
)

// Top-level categories (no parentId), ordered for display
const TOP_LEVEL_ORDER = ["fixed-appointments", "sharpen-the-saw", "role-tasks"]
const TOP_LEVEL = TOP_LEVEL_ORDER.map(id => CATEGORIES.find(c => c.id === id)!)

function childrenOf(parentId: string) {
  return CATEGORIES.filter(c => c.parentId === parentId)
}

// All child IDs under a parent (used for parent toggle logic)
function allDescendantIds(parentId: string): string[] {
  return CATEGORIES.filter(c => c.parentId === parentId).map(c => c.id)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function settingsEqual(a: Settings, b: Settings): boolean {
  if (a.allowSync !== b.allowSync) return false
  if (a.exportIds.size !== b.exportIds.size) return false
  for (const id of a.exportIds) if (!b.exportIds.has(id)) return false
  return true
}

const DEFAULT_SETTINGS: Settings = {
  allowSync: true,
  exportIds: new Set(CATEGORIES.filter(c => !PARENT_IDS.has(c.id)).map(c => c.id)),
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoogleCalendarSettingsPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [saved, setSaved] = useState<Settings>(DEFAULT_SETTINGS)
  const [current, setCurrent] = useState<Settings>({
    allowSync: DEFAULT_SETTINGS.allowSync,
    exportIds: new Set(DEFAULT_SETTINGS.exportIds),
  })
  const [expanded, setExpanded] = useState<Set<string>>(new Set(PARENT_IDS))

  const isDirty = !settingsEqual(saved, current)

  // ── Category toggle helpers ──────────────────────────────────────────────

  function isChecked(id: string): boolean {
    if (PARENT_IDS.has(id)) {
      const children = allDescendantIds(id)
      return children.length > 0 && children.every(cid => current.exportIds.has(cid))
    }
    return current.exportIds.has(id)
  }

  function isIndeterminate(id: string): boolean {
    if (!PARENT_IDS.has(id)) return false
    const children = allDescendantIds(id)
    const checked = children.filter(cid => current.exportIds.has(cid)).length
    return checked > 0 && checked < children.length
  }

  function toggleCategory(id: string) {
    setCurrent(prev => {
      const next = new Set(prev.exportIds)
      if (PARENT_IDS.has(id)) {
        const children = allDescendantIds(id)
        const allOn = children.every(cid => next.has(cid))
        children.forEach(cid => (allOn ? next.delete(cid) : next.add(cid)))
      } else {
        next.has(id) ? next.delete(id) : next.add(id)
      }
      return { ...prev, exportIds: next }
    })
  }

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Discard / Save ───────────────────────────────────────────────────────

  function discard() {
    setCurrent({ allowSync: saved.allowSync, exportIds: new Set(saved.exportIds) })
  }

  function save() {
    setSaved({ allowSync: current.allowSync, exportIds: new Set(current.exportIds) })
  }

  // ── Connect / Disconnect ─────────────────────────────────────────────────

  function connect() {
    setIsConnected(true)
  }

  function disconnect() {
    setIsConnected(false)
    discard()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav
        action="back"
        extra={
          isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/30">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">Connected</span>
            </div>
          ) : undefined
        }
      />

      <main className="relative z-10 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Google Calendar <span className="text-primary">Settings</span>
              </h1>
            </div>
            <p className="text-muted-foreground font-serif text-lg ml-[52px]">
              Connect your Google Calendar and choose what gets exported from HabitFlow.
            </p>
          </div>

          {!isConnected ? (
            /* ── Disconnected state ── */
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="p-6 rounded-2xl bg-card border-2 border-border max-w-md w-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Connect Google Calendar
                </h2>
                <p className="text-muted-foreground font-serif text-sm mb-6">
                  Sync your HabitFlow schedule, tasks, and activities directly to Google Calendar so
                  everything stays in one place.
                </p>
                <Button
                  onClick={connect}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Connect Google Calendar
                </Button>
              </div>
            </div>
          ) : (
            /* ── Connected settings ── */
            <div className="space-y-6">
              {/* Connection card */}
              <div className="p-6 rounded-2xl bg-card border-2 border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Google Calendar connected</p>
                    <p className="text-sm text-muted-foreground font-serif">
                      Your account is linked and ready to export.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={disconnect}
                  className="border-border text-foreground hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive shrink-0 gap-2"
                >
                  <Link2Off className="w-4 h-4" />
                  Disconnect
                </Button>
              </div>

              {/* Sync toggle */}
              <div className="p-6 rounded-2xl bg-card border-2 border-border">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label
                      htmlFor="allow-sync"
                      className="text-base font-bold text-foreground cursor-pointer"
                    >
                      Allow Sync Changes
                    </Label>
                    <p className="text-sm text-muted-foreground font-serif mt-0.5">
                      Automatically push updates to Google Calendar whenever you edit your schedule
                      in HabitFlow.
                    </p>
                  </div>
                  <Switch
                    id="allow-sync"
                    checked={current.allowSync}
                    onCheckedChange={val =>
                      setCurrent(prev => ({ ...prev, allowSync: val }))
                    }
                    className="shrink-0"
                  />
                </div>
              </div>

              {/* Export categories */}
              <div className="p-6 rounded-2xl bg-card border-2 border-border">
                <h2 className="text-xl font-bold text-foreground mb-1">Export Categories</h2>
                <p className="text-sm text-muted-foreground font-serif mb-6">
                  Choose which items from HabitFlow are exported to your Google Calendar.
                </p>

                <div className="space-y-2">
                  {TOP_LEVEL.map(cat => {
                    const hasChildren = PARENT_IDS.has(cat.id)
                    const isOpen = expanded.has(cat.id)
                    const children = hasChildren ? childrenOf(cat.id) : []
                    const checked = isChecked(cat.id)
                    const indeterminate = isIndeterminate(cat.id)

                    return (
                      <div key={cat.id}>
                        {/* Parent row */}
                        <div
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                            hasChildren
                              ? "hover:bg-secondary/10 cursor-default"
                              : "hover:bg-secondary/10"
                          }`}
                        >
                          {/* Checkbox */}
                          <button
                            role="checkbox"
                            aria-checked={indeterminate ? "mixed" : checked}
                            onClick={() => toggleCategory(cat.id)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              checked
                                ? "bg-primary border-primary"
                                : indeterminate
                                  ? "bg-primary/40 border-primary/60"
                                  : "bg-muted border-border hover:border-primary/60"
                            }`}
                          >
                            {(checked || indeterminate) && (
                              <svg
                                viewBox="0 0 12 12"
                                className="w-3 h-3 text-white fill-none stroke-current stroke-2"
                              >
                                {indeterminate ? (
                                  <line x1="2" y1="6" x2="10" y2="6" />
                                ) : (
                                  <polyline points="2,6 5,9 10,3" />
                                )}
                              </svg>
                            )}
                          </button>

                          {/* Label */}
                          <span
                            className="flex-1 font-semibold text-foreground cursor-pointer select-none"
                            onClick={() => toggleCategory(cat.id)}
                          >
                            {cat.label}
                          </span>

                          {/* Expand toggle */}
                          {hasChildren && (
                            <button
                              onClick={() => toggleExpanded(cat.id)}
                              className="p-1 rounded-lg hover:bg-secondary/20 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={isOpen ? "Collapse" : "Expand"}
                            >
                              {isOpen ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Children */}
                        {hasChildren && isOpen && (
                          <div className="ml-8 mt-1 mb-2 space-y-1 border-l-2 border-border pl-4">
                            {children.map(child => {
                              const childChecked = current.exportIds.has(child.id)
                              return (
                                <button
                                  key={child.id}
                                  onClick={() => toggleCategory(child.id)}
                                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary/10 transition-colors text-left"
                                >
                                  <div
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      childChecked
                                        ? "bg-primary border-primary"
                                        : "bg-muted border-border hover:border-primary/60"
                                    }`}
                                  >
                                    {childChecked && (
                                      <svg
                                        viewBox="0 0 12 12"
                                        className="w-2.5 h-2.5 text-white fill-none stroke-current stroke-2"
                                      >
                                        <polyline points="2,6 5,9 10,3" />
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-sm text-muted-foreground font-serif group-hover:text-foreground">
                                    {child.label}
                                  </span>
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

              {/* Discard / Save — only visible when dirty */}
              {isDirty && (
                <div className="sticky bottom-6 z-20">
                  <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-2xl bg-card border-2 border-primary/30 shadow-lg shadow-primary/10">
                    <p className="text-sm text-muted-foreground font-serif flex-1">
                      You have unsaved changes.
                    </p>
                    <Button
                      variant="outline"
                      onClick={discard}
                      className="border-border text-foreground hover:bg-secondary/20 gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Discard
                    </Button>
                    <Button
                      onClick={save}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
