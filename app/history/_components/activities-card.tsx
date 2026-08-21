"use client"

import { useMemo } from "react"
import { Zap } from "lucide-react"
import { groupBy } from "../_utils/group"
import type { HistoryActivity } from "../_types"

interface Props {
  activities: HistoryActivity[]
}

export function ActivitiesCard({ activities }: Props) {
  const byDimension = useMemo(() => groupBy(activities, a => a.dimensionId), [activities])
  const dimensionIds = Object.keys(byDimension)

  return (
    <div className="p-5 rounded-2xl bg-card border-2 border-border h-full">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <h3 className="font-bold text-foreground">Sharpen the Saw</h3>
        <span className="ml-auto text-xs text-muted-foreground font-serif">
          {activities.length} activit{activities.length !== 1 ? "ies" : "y"}
        </span>
      </div>
      {dimensionIds.length === 0 ? (
        <p className="text-sm text-muted-foreground font-serif italic">No activities recorded.</p>
      ) : (
        <div className="space-y-4">
          {dimensionIds.map(dimensionId => {
            const dimActivities = byDimension[dimensionId]
            const { dimensionLabel, dimensionColor } = dimActivities[0]
            return (
              <div key={dimensionId}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dimensionColor }} />
                  <span className="text-sm font-semibold text-foreground">{dimensionLabel}</span>
                </div>
                <ul className="space-y-1.5 ml-[18px]">
                  {dimActivities.map(activity => (
                    <li
                      key={activity.activityId}
                      className="flex items-start gap-2 text-sm text-muted-foreground font-serif"
                    >
                      <span
                        className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                        style={{ backgroundColor: dimensionColor }}
                      />
                      <span>
                        {activity.activityText}
                        {/* The activity is gone from the standing library, but the week renewed
                            with it. Flagged rather than hidden, for the same reason a dropped goal
                            is: soft delete hides things from the future, never from the past. */}
                        {activity.isDeleted && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground/70">removed since</span>
                        )}
                      </span>
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
