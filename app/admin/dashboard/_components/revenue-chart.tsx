"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { REVENUE_BAR } from "../_constants/admin"
import { money, monthFull, monthLabel } from "../_utils/format"
import type { ApiAdminRevenue } from "@/lib/api"

interface Datum {
  month: string
  label: string
  cents: number
}

function ChartTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: { payload: Datum }[]
  currency: string
}) {
  if (!active || !payload?.length) return null
  const datum = payload[0].payload

  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-foreground mb-0.5">{monthFull(datum.month)}</p>
      <p className="text-muted-foreground">{money(datum.cents, currency)}</p>
    </div>
  )
}

/**
 * Revenue by calendar month, oldest month on the left.
 *
 * **Bars, not a line.** Each value is a total collected *over* a month rather than a reading taken
 * at a moment, and a line drawn between two totals implies the figure passed through every value
 * between them — which for a sum over a period is a claim about nothing.
 *
 * **One series, one colour, no legend.** There is a single measure here, so a second hue would
 * have nothing to distinguish and the card's title already names what the bars are. The empty
 * months are sent as zeroes rather than omitted, so the axis is continuous and a quiet month reads
 * as a gap in revenue rather than as a gap in the data.
 */
export function RevenueChart({ revenue }: { revenue: ApiAdminRevenue }) {
  const currency = revenue.currency
  const data: Datum[] = revenue.monthly.map(point => ({
    ...point,
    label: monthLabel(point.month),
  }))
  const hasRevenue = currency !== null && data.some(point => point.cents > 0)

  return (
    <section
      aria-label="Revenue by month"
      className="p-6 rounded-2xl bg-card border-2 border-border h-full"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Revenue by Month</h2>
          <p className="text-xs text-muted-foreground font-serif mt-0.5">
            Paid invoices only, over the last 13 months
            {currency ? ` · ${currency.toUpperCase()}` : ""}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-primary tabular-nums">
            {money(revenue.total_cents, currency)}
          </p>
          <p className="text-xs text-muted-foreground">all time</p>
        </div>
      </div>

      {hasRevenue ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barSize={22} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "#b8b8ff", fontSize: 11, fontFamily: "inherit" }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              /* Major units, not minor: an axis labelled in cents reads as an amount a hundred
                 times too big, which is the one mistake a money chart must not make. */
              tickFormatter={value => Math.round(value / 100).toLocaleString()}
              tick={{ fill: "#b8b8ff", fontSize: 11, fontFamily: "inherit" }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              content={<ChartTooltip currency={currency} />}
              cursor={{ fill: "#471396", opacity: 0.3 }}
            />
            {/* Rounded at the data end only, anchored flat to the baseline — a bar rounded at both
                ends floats off its own axis and reads as shorter than it is. */}
            <Bar dataKey="cents" fill={REVENUE_BAR} radius={[4, 4, 0, 0]} animationDuration={600} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm font-serif text-center px-6">
          No paid invoices yet. This fills in as subscriptions are charged.
        </div>
      )}

      {revenue.other_currencies.length > 0 && (
        /* Listed rather than added in. A total that has summed two currencies is not a figure
           anyone can act on, so the chart describes one and names the rest. */
        <p className="text-xs text-muted-foreground font-serif mt-3 pt-3 border-t border-border">
          Also collected:{" "}
          {revenue.other_currencies
            .map(other => money(other.total_cents, other.currency))
            .join(" · ")}
        </p>
      )}
    </section>
  )
}
