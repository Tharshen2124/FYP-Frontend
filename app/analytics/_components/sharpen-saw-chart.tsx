"use client"

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts"
import { EVEN_SHARE } from "../_utils/analytics"
import { DateRangeSelector } from "./date-selectors"
import type { DateSelection, SharpenBalance } from "../_types"

/**
 * The radius axis runs the full 0–100, so a point's distance from the centre *is* its share: 50%
 * reaches half way out, and a dimension holding 65% of the renewal work draws two thirds of the way
 * to the rim. Only a dimension that has taken everything touches the rim.
 *
 * Nothing is fitted to the data, so the same shape always means the same thing and two ranges can
 * be compared by eye. Size is not the signal an even week gives — a balanced 25/25/25/25 draws a
 * small diamond sitting exactly on the dashed guide, and it is that alignment, not the area, that
 * says it is balanced.
 */
const AXIS_MAX = 100

interface TooltipPayload {
  payload: { dimension: string; share: number; completed: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground shadow-lg">
      <span className="font-medium">{item.dimension}</span>
      <span className="text-muted-foreground ml-2">
        {item.share}% · {item.completed} {item.completed === 1 ? "task" : "tasks"}
      </span>
    </div>
  )
}

interface SharpenSawChartProps {
  data: SharpenBalance
  matchedWeeks: number
  from: DateSelection
  to: DateSelection
  years: number[]
  spanLabel: string
  onFromChange: (v: DateSelection) => void
  onToChange: (v: DateSelection) => void
}

export function SharpenSawChart({
  data, matchedWeeks, from, to, years, spanLabel, onFromChange, onToChange,
}: SharpenSawChartProps) {
  const hasData = matchedWeeks > 0 && data.completed > 0

  const chartData = data.dimensions.map(d => ({ ...d, even: EVEN_SHARE }))

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Sharpen the Saw Balance</h2>
          <p className="text-xs text-muted-foreground font-serif mt-0.5">
            How your completed renewal tasks split across the 4 dimensions
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-primary">{hasData ? `${data.balance}%` : "—"}</p>
          <p className="text-xs text-muted-foreground">balance</p>
        </div>
      </div>

      <DateRangeSelector
        from={from}
        to={to}
        years={years}
        spanLabel={spanLabel}
        onFromChange={onFromChange}
        onToChange={onToChange}
      />

      {hasData ? (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius={100}>
              <PolarGrid stroke="#471396" />
              <PolarAngleAxis
                dataKey="dimension"
                // "Social / Emotional" is the dimension's real name and belongs in the legend, but
                // it will not fit round the axis — the half before the slash is what it is called.
                tickFormatter={(v: string) => v.split(" / ")[0]}
                tick={{ fill: "#b8b8ff", fontSize: 12, fontFamily: "inherit" }}
              />
              <PolarRadiusAxis domain={[0, AXIS_MAX]} tick={false} axisLine={false} tickCount={3} />
              {/* The even split, drawn underneath as the shape to aim for. */}
              <Radar
                dataKey="even"
                stroke="#c9c9ff"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                fill="none"
                dot={false}
                isAnimationActive={false}
              />
              <Radar
                dataKey="share"
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

          <p className="text-[11px] text-muted-foreground font-serif text-center mt-1 mb-2">
            Dashed guide: an even {EVEN_SHARE}% in every dimension
          </p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {data.dimensions.map((d) => (
              <div key={d.dimension} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-sm text-muted-foreground">{d.dimension}</span>
                <span className="text-sm font-bold ml-auto" style={{ color: d.color }}>{d.share}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-52 text-center text-muted-foreground text-sm font-serif px-4">
          {matchedWeeks === 0
            ? "You planned no weeks in this range."
            : "No renewal tasks were completed in this range, so there is no split to show."}
        </div>
      )}
    </div>
  )
}
