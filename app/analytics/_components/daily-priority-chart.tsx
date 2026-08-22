"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Star } from "lucide-react"
import { CARD_INFO } from "../_constants/analytics"
import { SingleDateSelector } from "./date-selectors"
import { MetricInfo } from "./metric-info"
import type { DailyPriorityDay, DateSelection } from "../_types"

interface TooltipPayload {
  payload: { day: string; completed: number; total: number; pct: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground shadow-lg">
      <p className="font-medium mb-0.5">{d.day}</p>
      <p className="text-muted-foreground">{d.completed}/{d.total} priorities</p>
    </div>
  )
}

interface DailyPriorityChartProps {
  days: DailyPriorityDay[]
  label: string
  value: DateSelection
  years: number[]
  onChange: (v: DateSelection) => void
}

export function DailyPriorityChart({ days, label, value, years, onChange }: DailyPriorityChartProps) {
  const hasData = days.length > 0

  const chartData = days.map((d) => ({
    ...d,
    pct: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
  }))

  const daysHit   = days.filter((d) => d.total > 0 && d.completed === d.total).length
  const totalDays = days.filter((d) => d.total > 0).length
  const totalCompleted = days.reduce((s, d) => s + d.completed, 0)
  const totalPossible  = days.reduce((s, d) => s + d.total, 0)
  const overallPct = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border h-full">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-lg font-bold text-foreground">Daily Priority Hit Rate</h2>
          <p className="text-xs text-muted-foreground font-serif mt-0.5">
            How often starred priorities were completed each day
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-primary">{totalPossible > 0 ? `${overallPct}%` : "—"}</p>
          <p className="text-xs text-muted-foreground">hit rate</p>
        </div>
      </div>

      <MetricInfo paragraphs={CARD_INFO.priority} />

      <div className="mt-3 mb-1">
        <SingleDateSelector value={value} years={years} onChange={onChange} />
      </div>

      {hasData ? (
        <>
          <p className="text-xs text-muted-foreground mb-2 font-serif">{label}</p>

          <ResponsiveContainer width="100%" height={165}>
            {/* left: -18 rather than -28 — the axis tops out at "100%", and a wider negative margin
                clipped its leading digit. */}
            <BarChart data={chartData} barSize={28} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <XAxis
                dataKey="day"
                tick={{ fill: "#b8b8ff", fontSize: 12, fontFamily: "inherit" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "#b8b8ff", fontSize: 11, fontFamily: "inherit" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#471396", opacity: 0.3 }} />
              <Bar dataKey="pct" radius={[6, 6, 0, 0]} animationBegin={0} animationDuration={600}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.day}
                    fill={entry.pct === 100 ? "#B13BFF" : entry.pct >= 67 ? "#471396" : "#1a0080"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span>Full days hit</span>
            </div>
            <div className="flex items-center gap-1">
              {days.map((d) => {
                const full    = d.total > 0 && d.completed === d.total
                const partial = d.total > 0 && d.completed > 0 && d.completed < d.total
                return (
                  <div
                    key={d.day}
                    title={`${d.day}: ${d.completed}/${d.total}`}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: full ? "#B13BFF" : partial ? "#471396" : "#1a0080",
                      color: full ? "#fff" : partial ? "#b8b8ff" : "#4a4a8a",
                    }}
                  >
                    {d.day[0]}
                  </div>
                )
              })}
              <span className="ml-2 text-sm font-bold text-foreground">{daysHit}/{totalDays}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-serif">
          You didn&apos;t plan the week containing that date.
        </div>
      )}
    </div>
  )
}
