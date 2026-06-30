"use client"

import { Calendar, ChevronDown, ChevronRight, CheckCircle2, Link2, Link2Off, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { TOP_LEVEL, PARENT_IDS } from "../_constants/categories"
import { childrenOf, isChecked, isIndeterminate, toggleCategory } from "../_utils"
import { type CalSettings } from "../_types"

interface Props {
  isConnected: boolean
  saved: CalSettings
  current: CalSettings
  expanded: Set<string>
  isDirty: boolean
  onConnect: () => void
  onDisconnect: () => void
  onToggleSync: (val: boolean) => void
  onToggleCategory: (id: string) => void
  onToggleExpanded: (id: string) => void
  onDiscard: () => void
  onSave: () => void
}

export function GoogleCalendarSection({
  isConnected,
  current,
  expanded,
  isDirty,
  onConnect,
  onDisconnect,
  onToggleSync,
  onToggleCategory,
  onToggleExpanded,
  onDiscard,
  onSave,
}: Props) {
  return (
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
            onClick={onConnect}
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
              onClick={onDisconnect}
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
                onCheckedChange={onToggleSync}
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
                const checked = isChecked(cat.id, current.exportIds)
                const indeterminate = isIndeterminate(cat.id, current.exportIds)

                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/10 transition-colors">
                      <button
                        role="checkbox"
                        aria-checked={indeterminate ? "mixed" : checked}
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
                        <button onClick={() => onToggleExpanded(cat.id)} className="p-1 rounded-lg hover:bg-secondary/20 text-muted-foreground hover:text-foreground transition-colors">
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

          {/* Discard / Save */}
          {isDirty && (
            <div className="sticky bottom-6 z-20">
              <div className="flex items-center justify-end gap-3 px-6 py-4 rounded-2xl bg-card border-2 border-primary/30 shadow-lg shadow-primary/10">
                <p className="text-sm text-muted-foreground font-serif flex-1">You have unsaved changes.</p>
                <Button variant="outline" onClick={onDiscard} className="border-border text-foreground hover:bg-secondary/20 gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Discard
                </Button>
                <Button onClick={onSave} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
