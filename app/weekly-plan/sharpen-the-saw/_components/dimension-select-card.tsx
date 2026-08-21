"use client"

import { Check } from "lucide-react"
import type { PlanDimension } from "../../_types"

interface Props {
  dimension: PlanDimension
  selectedActivityIds: Set<string>
  onToggleActivity: (activityId: string) => void
}

export function DimensionSelectCard({ dimension, selectedActivityIds, onToggleActivity }: Props) {
  const Icon = dimension.icon

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border">
      {/* Dimension header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${dimension.color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: dimension.color }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{dimension.label}</h2>
        </div>
      </div>

      {/* Activities — select which to commit to this week */}
      <div className="space-y-2">
        {dimension.activities.map(act => {
          const isSelected = selectedActivityIds.has(act.id)
          return (
            <button
              key={act.id}
              type="button"
              // A toggle, not a link: without aria-pressed nothing in the accessibility tree says
              // whether this activity is committed to the week.
              aria-pressed={isSelected}
              onClick={() => onToggleActivity(act.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? "border-2 bg-opacity-10"
                  : "bg-muted border-border hover:border-primary/30"
              }`}
              style={isSelected ? { backgroundColor: `${dimension.color}15`, borderColor: dimension.color } : {}}
            >
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={
                  isSelected
                    ? { backgroundColor: dimension.color, borderColor: dimension.color }
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
}
