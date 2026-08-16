"use client"

import { useState } from "react"
import { Calendar, CheckCircle2, Link2, Link2Off, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DEFAULT_CAL_SETTINGS, PARENT_IDS } from "../_constants/categories"
import { settingsEqual, toggleCategoryIds } from "../_utils/categories"
import { ExportCategoryTree } from "./export-category-tree"
import type { CalSettings } from "../_types"

export function GoogleCalendarCard() {
  const [isConnected, setIsConnected] = useState(false)
  const [saved, setSaved] = useState<CalSettings>(DEFAULT_CAL_SETTINGS)
  const [current, setCurrent] = useState<CalSettings>({
    allowSync: DEFAULT_CAL_SETTINGS.allowSync,
    exportIds: new Set(DEFAULT_CAL_SETTINGS.exportIds),
  })
  const [expanded, setExpanded] = useState<Set<string>>(new Set(PARENT_IDS))

  const isDirty = !settingsEqual(saved, current)

  const toggleCategory = (id: string) => {
    setCurrent(prev => ({ ...prev, exportIds: toggleCategoryIds(prev.exportIds, id) }))
  }

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const discard = () => {
    setCurrent({ allowSync: saved.allowSync, exportIds: new Set(saved.exportIds) })
  }

  const save = () => {
    setSaved({ allowSync: current.allowSync, exportIds: new Set(current.exportIds) })
    toast.success("Google Calendar settings saved")
  }

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

          <ExportCategoryTree
            exportIds={current.exportIds}
            expanded={expanded}
            onToggleCategory={toggleCategory}
            onToggleExpanded={toggleExpanded}
          />

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
  )
}
