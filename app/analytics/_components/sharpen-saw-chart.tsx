"use client"

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts"
import { DateRangeSelector } from "./date-selectors"
import type { DateSelection, SharpenDimension } from "../_types"

interface TooltipPayload {
  payload: { dimension: string; score: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground shadow-lg">
      <span className="font-medium">{item.dimension}</span>
      <span className="text-muted-foreground ml-2">{item.score}%</span>
    </div>
  )
}

interface SharpenSawChartProps {
  data: SharpenDimension[]
  matchedWeeks: number
  from: DateSelection
  to: DateSelection
  years: number[]
  onFromChange: (v: DateSelection) => void
  onToChange: (v: DateSelection) => void
}

export function SharpenSawChart({
  data, matchedWeeks, from, to, years, onFromChange, onToChange,
}: SharpenSawChartProps) {
  const hasData = matchedWeeks > 0 && data.length > 0
  const avgScore = hasData ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Sharpen the Saw Balance</h2>
          <p className="text-xs text-muted-foreground font-serif mt-0.5">
            Renewal tasks completed across all 4 dimensions
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-primary">{hasData ? `${avgScore}%` : "—"}</p>
          <p className="text-xs text-muted-foreground">avg balance</p>
        </div>
      </div>

      <DateRangeSelector
        from={from}
        to={to}
        years={years}
        onFromChange={onFromChange}
        onToChange={onToChange}
      />

      {hasData ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={data} cx="50%" cy="50%" outerRadius={72}>
              <PolarGrid stroke="#471396" />
              <PolarAngleAxis
                dataKey="dimension"
                // "Social / Emotional" is the dimension's real name and belongs in the legend, but
                // it will not fit round the axis — the half before the slash is what it is called.
                tickFormatter={(v: string) => v.split(" / ")[0]}
                tick={{ fill: "#b8b8ff", fontSize: 12, fontFamily: "inherit" }}
              />
              <Radar
                dataKey="score"
                stroke="#B13BFF"
                fill="#B13BFF"
                fillOpacity={0.25}
                strokeWidth={2}
                dot={{ fill: "#B13BFF", r: 4, strokeWidth: 0 }}
                animationBegin={0}
                animationDuration={600}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2">
            {data.map((d) => (
              <div key={d.dimension} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-sm text-muted-foreground">{d.dimension}</span>
                <span className="text-sm font-bold ml-auto" style={{ color: d.color }}>{d.score}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-52 text-muted-foreground text-sm font-serif">
          You planned no weeks in this range.
        </div>
      )}
    </div>
  )
}
