"use client"

import { MONTH_NAMES } from "../_constants/analytics"
import type { DateSelection } from "../_types"

const baseSelect =
  "bg-muted border border-border rounded-lg px-1.5 py-1 text-xs text-foreground " +
  "focus:outline-none focus:border-primary cursor-pointer appearance-none"

interface DatePickerProps {
  value: DateSelection
  years: number[]
  onChange: (v: DateSelection) => void
}

function DatePicker({ value, years, onChange }: DatePickerProps) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <div className="flex items-center gap-1">
      {/* Day */}
      <select
        value={value.day}
        onChange={(e) => onChange({ ...value, day: Number(e.target.value) })}
        className={`${baseSelect} w-10 text-center`}
      >
        {days.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Month */}
      <select
        value={value.month}
        onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}
        className={`${baseSelect} w-12`}
      >
        {MONTH_NAMES.map((m, i) => (
          <option key={i} value={i}>{m}</option>
        ))}
      </select>

      {/* Year */}
      <select
        value={value.year}
        onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
        className={`${baseSelect} w-16`}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}

// Range selector — From date + To date
interface DateRangeSelectorProps {
  from: DateSelection
  to: DateSelection
  years: number[]
  onFromChange: (v: DateSelection) => void
  onToChange: (v: DateSelection) => void
}

export function DateRangeSelector({ from, to, years, onFromChange, onToChange }: DateRangeSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-8 shrink-0">From</span>
        <DatePicker value={from} years={years} onChange={onFromChange} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-8 shrink-0">To</span>
        <DatePicker value={to} years={years} onChange={onToChange} />
      </div>
    </div>
  )
}

// Single date selector — resolves to the week containing the chosen date
interface SingleDateSelectorProps {
  value: DateSelection
  years: number[]
  onChange: (v: DateSelection) => void
}

export function SingleDateSelector({ value, years, onChange }: SingleDateSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">Week of</span>
      <DatePicker value={value} years={years} onChange={onChange} />
    </div>
  )
}
