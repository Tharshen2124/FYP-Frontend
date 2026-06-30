"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { AppNav } from "@/components/app-nav"
import { MOCK_DIMENSIONS } from "@/app/weekly-plan/schedule/_constants/mock-data"

export default function WeeklyPlanSharpenTheSawPage() {
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set())

  const toggleActivity = (actId: string) => {
    setSelectedActivityIds(prev => {
      const next = new Set(prev)
      if (next.has(actId)) next.delete(actId)
      else next.add(actId)
      return next
    })
  }

  const canProceed = selectedActivityIds.size > 0

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

                  {/* Activities — select which to commit to this week */}
                  <div className="space-y-2">
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
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
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
