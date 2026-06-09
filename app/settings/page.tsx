"use client"

import { useState } from "react"
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Link2,
  Link2Off,
  Moon,
  RotateCcw,
  Save,
} from "lucide-react"
import { toast } from "sonner"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

// ─── Google Calendar types & data ─────────────────────────────────────────────

interface CategoryItem {
  id: string
  label: string
  parentId?: string
}

interface CalSettings {
  allowSync: boolean
  exportIds: Set<string>
}

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
  { id: "role-tasks", label: "Role Tasks" },
  ...MOCK_ROLES.map(r => ({
    id: `role-${r.toLowerCase().replace(/\s+/g, "-")}`,
    label: `${r} Tasks`,
    parentId: "role-tasks",
  })),
]

const PARENT_IDS = new Set(CATEGORIES.filter(c => c.parentId).map(c => c.parentId!))
const TOP_LEVEL_ORDER = ["fixed-appointments", "sharpen-the-saw", "role-tasks"]
const TOP_LEVEL = TOP_LEVEL_ORDER.map(id => CATEGORIES.find(c => c.id === id)!)

function childrenOf(parentId: string) {
  return CATEGORIES.filter(c => c.parentId === parentId)
}

function allDescendantIds(parentId: string) {
  return CATEGORIES.filter(c => c.parentId === parentId).map(c => c.id)
}

function settingsEqual(a: CalSettings, b: CalSettings) {
  if (a.allowSync !== b.allowSync) return false
  if (a.exportIds.size !== b.exportIds.size) return false
  for (const id of a.exportIds) if (!b.exportIds.has(id)) return false
  return true
}

const DEFAULT_CAL_SETTINGS: CalSettings = {
  allowSync: true,
  exportIds: new Set(CATEGORIES.filter(c => !PARENT_IDS.has(c.id)).map(c => c.id)),
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // End-of-day time
  const [eodTime, setEodTime] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("eod_time") ?? "21:00"
    return "21:00"
  })

  const saveEodTime = () => {
    localStorage.setItem("eod_time", eodTime)
    // Reset today's shown flag so the modal can appear again with the new time
    localStorage.removeItem("eod_shown_date")
    toast.success("End-of-day time saved")
  }

  // Google Calendar
  const [isConnected, setIsConnected] = useState(false)
  const [saved, setSaved] = useState<CalSettings>(DEFAULT_CAL_SETTINGS)
  const [current, setCurrent] = useState<CalSettings>({
    allowSync: DEFAULT_CAL_SETTINGS.allowSync,
    exportIds: new Set(DEFAULT_CAL_SETTINGS.exportIds),
  })
  const [expanded, setExpanded] = useState<Set<string>>(new Set(PARENT_IDS))

  const isDirty = !settingsEqual(saved, current)

  function isChecked(id: string) {
    if (PARENT_IDS.has(id)) {
      const children = allDescendantIds(id)
      return children.length > 0 && children.every(cid => current.exportIds.has(cid))
    }
    return current.exportIds.has(id)
  }

  function isIndeterminate(id: string) {
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

  function discard() {
    setCurrent({ allowSync: saved.allowSync, exportIds: new Set(saved.exportIds) })
  }

  function save() {
    setSaved({ allowSync: current.allowSync, exportIds: new Set(current.exportIds) })
    toast.success("Google Calendar settings saved")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
            <span className="text-primary">Settings</span>
          </h1>
          <p className="text-muted-foreground font-serif">
            Configure your HabitFlow experience.
          </p>
        </div>

        <div className="space-y-10">
          {/* ── End-of-Day Check-in ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">End-of-Day Check-in</h2>
            </div>

            <div className="p-6 rounded-2xl bg-card border-2 border-border">
              <p className="text-muted-foreground font-serif text-sm mb-5">
                A check-in modal will appear on your dashboard each day after the time you set below.
                It will show once per day and prompt you to mark completed tasks and write a reflection.
              </p>

              <div className="flex items-end gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="eod-time" className="text-foreground font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Show check-in at
                  </Label>
                  <Input
                    id="eod-time"
                    type="time"
                    value={eodTime}
                    onChange={e => setEodTime(e.target.value)}
                    className="w-36 bg-muted border-border text-foreground"
                  />
                </div>
                <Button onClick={saveEodTime} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>

              <p className="text-xs text-muted-foreground font-serif mt-3">
                Saving resets today&apos;s shown state so the modal will re-appear at the new time.
              </p>
            </div>
          </section>

          {/* ── Google Calendar ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Google Calendar</h2>
            </div>

            {!isConnected ? (
              <div className="p-6 rounded-2xl bg-card border-2 border-border max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                  <Calendar className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Connect Google Calendar</h3>
                <p className="text-muted-foreground font-serif text-sm mb-5">
                  Sync your HabitFlow schedule, tasks, and activities directly to Google Calendar so
                  everything stays in one place.
                </p>
                <Button
                  onClick={() => setIsConnected(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Connect Google Calendar
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Connection card */}
                <div className="p-6 rounded-2xl bg-card border-2 border-border flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Google Calendar connected</p>
                      <p className="text-sm text-muted-foreground font-serif">Your account is linked and ready to export.</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => { setIsConnected(false); discard() }}
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
                      <Label htmlFor="allow-sync" className="text-base font-bold text-foreground cursor-pointer">
                        Allow Sync Changes
                      </Label>
                      <p className="text-sm text-muted-foreground font-serif mt-0.5">
                        Automatically push updates to Google Calendar whenever you edit your schedule in HabitFlow.
                      </p>
                    </div>
                    <Switch
                      id="allow-sync"
                      checked={current.allowSync}
                      onCheckedChange={val => setCurrent(prev => ({ ...prev, allowSync: val }))}
                      className="shrink-0"
                    />
                  </div>
                </div>

                {/* Export categories */}
                <div className="p-6 rounded-2xl bg-card border-2 border-border">
                  <h3 className="text-lg font-bold text-foreground mb-1">Export Categories</h3>
                  <p className="text-sm text-muted-foreground font-serif mb-5">
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
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/10 transition-colors">
                            <button
                              role="checkbox"
                              aria-checked={indeterminate ? "mixed" : checked}
                              onClick={() => toggleCategory(cat.id)}
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
                            <span className="flex-1 font-semibold text-foreground cursor-pointer select-none" onClick={() => toggleCategory(cat.id)}>
                              {cat.label}
                            </span>
                            {hasChildren && (
                              <button onClick={() => toggleExpanded(cat.id)} className="p-1 rounded-lg hover:bg-secondary/20 text-muted-foreground hover:text-foreground transition-colors">
                                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            )}
                          </div>

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

                {/* Discard / Save */}
                {isDirty && (
                  <div className="sticky bottom-6 z-20">
                    <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-2xl bg-card border-2 border-primary/30 shadow-lg shadow-primary/10">
                      <p className="text-sm text-muted-foreground font-serif flex-1">You have unsaved changes.</p>
                      <Button variant="outline" onClick={discard} className="border-border text-foreground hover:bg-secondary/20 gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Discard
                      </Button>
                      <Button onClick={save} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
