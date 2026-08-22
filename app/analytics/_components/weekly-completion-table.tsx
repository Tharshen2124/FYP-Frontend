"use client"

import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { COMPLETION_WEEKS_SHOWN } from "../_constants/analytics"
import type { WeeklyCompletion } from "../_types"

interface TooltipPayload {
  payload: { shortLabel: string; pct: number; completed: number; total: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground shadow-lg">
      <p className="font-medium mb-0.5">{d.shortLabel}</p>
      <p className="text-muted-foreground">{d.completed}/{d.total} goals — {d.pct}%</p>
    </div>
  )
}

function percent(week: WeeklyCompletion): number {
  return week.total > 0 ? Math.round((week.completed / week.total) * 100) : 0
}

export function WeeklyCompletionTable({ weeks }: { weeks: WeeklyCompletion[] }) {
  // Ordered oldest → newest for the chart so the line reads left-to-right in time
  const chartData = [...weeks].reverse().map((w) => ({
    shortLabel: w.label.split(" – ")[0],
    label: w.label,
    pct: percent(w),
    completed: w.completed,
    total: w.total,
  }))

  // The newest week the page holds, which is the most recent one that has finished.
  const latest = weeks[0]

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border h-full">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Weekly Goal Completion</h2>
          <p className="text-xs text-muted-foreground font-serif mt-0.5">
            {COMPLETION_WEEKS_SHOWN}-week goal completion trend
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-2xl font-bold text-primary">{latest ? `${percent(latest)}%` : "—"}</p>
          <p className="text-xs text-muted-foreground">last week</p>
        </div>
      </div>

      {latest ? (
        <>
          {/* Trend area chart */}
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
              <defs>
                <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#B13BFF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#B13BFF" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="shortLabel"
                tick={{ fill: "#b8b8ff", fontSize: 11, fontFamily: "inherit" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#471396", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="#B13BFF"
                strokeWidth={2}
                fill="url(#completionGradient)"
                dot={{ fill: "#B13BFF", r: 3, strokeWidth: 0 }}
                activeDot={{ fill: "#B13BFF", r: 5, strokeWidth: 0 }}
                animationBegin={0}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Detail table */}
          <table className="w-full text-sm mt-3">
            <thead>
              <tr>
                <th className="text-left text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Week</th>
                <th className="text-left text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Progress</th>
                <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Done</th>
                <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium pl-3">Removed</th>
                <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium pl-3">%</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => {
                const pct = percent(week)
                return (
                  <tr key={week.id} className="border-t border-border">
                    <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground font-serif text-xs">
                      {week.label}
                    </td>
                    <td className="py-2 pr-4 w-full">
                      <div className="h-1.5 rounded-full bg-muted min-w-[60px]">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: "#B13BFF" }}
                        />
                      </div>
                    </td>
                    <td className="py-2 text-right text-muted-foreground whitespace-nowrap text-xs">
                      {week.completed}/{week.total}
                    </td>
                    {/* Dropped goals sit outside the ratio rather than counting as misses. */}
                    <td className="py-2 text-right pl-3 text-muted-foreground whitespace-nowrap text-xs">
                      {week.dropped > 0 ? week.dropped : "—"}
                    </td>
                    <td className="py-2 text-right pl-3 font-bold text-foreground whitespace-nowrap text-xs">
                      {pct}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      ) : (
        <div className="flex items-center justify-center h-52 text-muted-foreground text-sm font-serif">
          No finished week has been planned yet.
        </div>
      )}
    </div>
  )
}
