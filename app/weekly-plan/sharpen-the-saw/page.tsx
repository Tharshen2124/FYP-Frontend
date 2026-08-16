"use client"

import { useState } from "react"
import { AppNav } from "@/components/app-nav"
import { MOCK_DIMENSIONS } from "../_constants/mock-data"
import { DimensionSelectCard } from "./_components/dimension-select-card"

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
            {MOCK_DIMENSIONS.map(dim => (
              <DimensionSelectCard
                key={dim.id}
                dimension={dim}
                selectedActivityIds={selectedActivityIds}
                onToggleActivity={toggleActivity}
              />
            ))}
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
