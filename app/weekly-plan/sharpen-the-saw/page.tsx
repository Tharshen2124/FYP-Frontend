"use client"

import { useState } from "react"
import { Plus, X, Check } from "lucide-react"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MOCK_DIMENSIONS } from "@/app/weekly-plan/schedule/_constants/mock-data"

interface WeeklyActivity {
  id: string
  text: string
}

export default function WeeklyPlanSharpenTheSawPage() {
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set())
  const [weeklyActivities, setWeeklyActivities] = useState<Record<string, WeeklyActivity[]>>({})
  const [activityInputs, setActivityInputs] = useState<Record<string, string>>({})

  const toggleActivity = (actId: string) => {
    setSelectedActivityIds(prev => {
      const next = new Set(prev)
      if (next.has(actId)) next.delete(actId)
      else next.add(actId)
      return next
    })
  }

  const addWeeklyActivity = (dimId: string) => {
    const text = (activityInputs[dimId] || "").trim()
    if (!text) return
    const newAct: WeeklyActivity = { id: `wa-${Date.now()}`, text }
    setWeeklyActivities(prev => ({ ...prev, [dimId]: [...(prev[dimId] || []), newAct] }))
    setActivityInputs(prev => ({ ...prev, [dimId]: "" }))
  }

  const removeWeeklyActivity = (dimId: string, actId: string) => {
    setWeeklyActivities(prev => ({
      ...prev,
      [dimId]: (prev[dimId] || []).filter(a => a.id !== actId),
    }))
  }

  const totalWeeklyActivities = Object.values(weeklyActivities).reduce((sum, as) => sum + as.length, 0)
  const canProceed = selectedActivityIds.size + totalWeeklyActivities > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" nextHref="/weekly-plan/schedule" nextEnabled={canProceed} />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              This Week&apos;s <span className="text-primary">Renewal</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Choose which renewal activities you&apos;re committing to this week across all four dimensions.
            </p>
          </div>

          <div className="grid gap-6">
            {MOCK_DIMENSIONS.map(dim => {
              const Icon = dim.icon
              const dimWeeklyActivities = weeklyActivities[dim.id] || []
              return (
                <div
                  key={dim.id}
                  className="p-6 rounded-2xl bg-card border-2 border-border"
                >
                  {/* Dimension header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${dim.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: dim.color }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{dim.label}</h2>
                    </div>
                  </div>

                  {/* Existing activities — checkboxes */}
                  <div className="space-y-2 mb-4">
                    {dim.activities.map(act => {
                      const isSelected = selectedActivityIds.has(act.id)
                      return (
                        <button
                          key={act.id}
                          onClick={() => toggleActivity(act.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? "border-2 bg-opacity-10"
                              : "bg-muted border-border hover:border-primary/30"
                          }`}
                          style={isSelected ? { backgroundColor: `${dim.color}15`, borderColor: dim.color } : {}}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all`}
                            style={
                              isSelected
                                ? { backgroundColor: dim.color, borderColor: dim.color }
                                : { borderColor: "#6b7280" }
                            }
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="font-serif text-foreground text-sm">{act.text}</span>
                        </button>
                      )
                    })}

                    {/* Weekly-only activities */}
                    {dimWeeklyActivities.map(wa => (
                      <div
                        key={wa.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border-2 border-accent/30"
                      >
                        <div className="w-5 h-5 rounded-full bg-accent border-accent border-2 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-background" />
                        </div>
                        <span className="font-serif text-foreground text-sm flex-1">{wa.text}</span>
                        <span className="text-xs font-medium bg-accent/20 text-accent rounded-full px-2 py-0.5 whitespace-nowrap">
                          This week
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWeeklyActivity(dim.id, wa.id)}
                          className="text-muted-foreground hover:text-destructive p-1 h-auto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add weekly activity */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Add a one-off ${dim.label.toLowerCase()} activity for this week...`}
                      value={activityInputs[dim.id] || ""}
                      onChange={e => setActivityInputs(prev => ({ ...prev, [dim.id]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === "Enter") addWeeklyActivity(dim.id)
                      }}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
                    />
                    <Button
                      onClick={() => addWeeklyActivity(dim.id)}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {!canProceed && (
            <p className="text-center text-muted-foreground font-serif mt-8">
              Select at least one activity or add a new one to continue.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
