"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Sidebar } from "@/components/sidebar"
import { DEFAULT_CAL_SETTINGS, PARENT_IDS } from "./_constants/categories"
import { settingsEqual, toggleCategory } from "./_utils"
import { type CalSettings } from "./_types"
import { EodSection } from "./_components/eod-section"
import { GoogleCalendarSection } from "./_components/google-calendar-section"

export default function SettingsPage() {
  const [eodTime, setEodTime] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("eod_time") ?? "21:00"
    return "21:00"
  })

  const [isConnected, setIsConnected] = useState(false)
  const [saved, setSaved] = useState<CalSettings>(DEFAULT_CAL_SETTINGS)
  const [current, setCurrent] = useState<CalSettings>({
    allowSync: DEFAULT_CAL_SETTINGS.allowSync,
    exportIds: new Set(DEFAULT_CAL_SETTINGS.exportIds),
  })
  const [expanded, setExpanded] = useState<Set<string>>(new Set(PARENT_IDS))

  const isDirty = !settingsEqual(saved, current)

  const handleToggleCategory = (id: string) => {
    setCurrent(prev => ({ ...prev, exportIds: toggleCategory(id, prev.exportIds) }))
  }

  const handleToggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDiscard = () => {
    setCurrent({ allowSync: saved.allowSync, exportIds: new Set(saved.exportIds) })
  }

  const handleSave = () => {
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
          <EodSection eodTime={eodTime} onTimeChange={setEodTime} />

          <GoogleCalendarSection
            isConnected={isConnected}
            saved={saved}
            current={current}
            expanded={expanded}
            isDirty={isDirty}
            onConnect={() => setIsConnected(true)}
            onDisconnect={() => { setIsConnected(false); handleDiscard() }}
            onToggleSync={val => setCurrent(prev => ({ ...prev, allowSync: val }))}
            onToggleCategory={handleToggleCategory}
            onToggleExpanded={handleToggleExpanded}
            onDiscard={handleDiscard}
            onSave={handleSave}
          />
        </div>
      </main>
    </div>
  )
}
