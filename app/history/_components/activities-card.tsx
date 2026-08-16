"use client"

import { useMemo } from "react"
import { Zap } from "lucide-react"
import { groupBy } from "../_utils/group"
import type { HistoryActivity } from "../_types"

interface Props {
  activities: HistoryActivity[]
}

export function ActivitiesCard({ activities }: Props) {
  const byDimension = useMemo(() => groupBy(activities, a => a.dimensionLabel), [activities])
  const dims = Object.keys(byDimension)

  return (
    <div className="p-5 rounded-2xl bg-card border-2 border-border h-full">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <h3 className="font-bold text-foreground">Sharpen the Saw</h3>
        <span className="ml-auto text-xs text-muted-foreground font-serif">
          {activities.length} activit{activities.length !== 1 ? "ies" : "y"}
        </span>
      </div>
      {dims.length === 0 ? (
        <p className="text-sm text-muted-foreground font-serif italic">No activities recorded.</p>
      ) : (
        <div className="space-y-4">
          {dims.map(dim => {
            const dimActivities = byDimension[dim]
            const color = dimActivities[0].dimensionColor
            return (
              <div key={dim}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm font-semibold text-foreground">{dim}</span>
                </div>
                <ul className="space-y-1.5 ml-[18px]">
                  {dimActivities.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      {a.activityText}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
