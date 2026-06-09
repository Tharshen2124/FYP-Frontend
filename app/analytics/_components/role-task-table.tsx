"use client"

import { useState } from "react"
import { getRoleStats, DEFAULT_FROM, DEFAULT_TO, type DateSelection } from "../_constants/mock-data"
import { DateRangeSelector } from "./week-range-selector"

export function RoleTaskTable() {
  const [from, setFrom] = useState<DateSelection>(DEFAULT_FROM)
  const [to,   setTo]   = useState<DateSelection>(DEFAULT_TO)

  const stats = getRoleStats(from, to)

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border h-full">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-foreground">Tasks Completed Per Role</h2>
        <p className="text-xs text-muted-foreground font-serif mt-0.5">
          Completed vs total tasks by role
        </p>
      </div>

      <div className="mb-4">
        <DateRangeSelector from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs uppercase tracking-wider text-muted-foreground pb-3 font-medium">Role</th>
            <th className="text-left text-xs uppercase tracking-wider text-muted-foreground pb-3 font-medium">Progress</th>
            <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-3 font-medium">Done</th>
            <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-3 font-medium pl-4">%</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => {
            const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0
            return (
              <tr key={stat.role} className="border-t border-border">
                <td className="py-3 pr-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stat.color }} />
                    <span className="text-foreground font-medium">{stat.role}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 w-full">
                  <div className="h-1.5 rounded-full bg-muted min-w-[80px]">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: stat.color }}
                    />
                  </div>
                </td>
                <td className="py-3 text-right text-muted-foreground whitespace-nowrap">
                  {stat.completed}/{stat.total}
                </td>
                <td className="py-3 text-right pl-4 font-bold whitespace-nowrap" style={{ color: stat.color }}>
                  {pct}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
