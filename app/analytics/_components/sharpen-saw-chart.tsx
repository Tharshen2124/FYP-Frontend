"use client"

import { useState } from "react"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts"
import {
  getSharpenData, DEFAULT_FROM, DEFAULT_TO, type DateSelection,
} from "../_constants/mock-data"
import { DateRangeSelector } from "./week-range-selector"

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

export function SharpenSawChart() {
  const [from, setFrom] = useState<DateSelection>(DEFAULT_FROM)
  const [to,   setTo]   = useState<DateSelection>(DEFAULT_TO)

  const data     = getSharpenData(from, to)
  const avgScore = Math.round(data.reduce((s, d) => s + d.score, 0) / data.length)

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Sharpen the Saw Balance</h2>
          <p className="text-xs text-muted-foreground font-serif mt-0.5">
            Activity coverage across all 4 dimensions
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-primary">{avgScore}%</p>
          <p className="text-xs text-muted-foreground">avg balance</p>
        </div>
      </div>

      <DateRangeSelector from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius={72}>
          <PolarGrid stroke="#471396" />
          <PolarAngleAxis
            dataKey="dimension"
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
    </div>
  )
}
