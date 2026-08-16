/** Compact clock label, e.g. 540 → "9am", 570 → "9:30am". */
export function fmtTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const ampm = h < 12 ? "am" : "pm"
  const hh = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hh}${ampm}` : `${hh}:${m.toString().padStart(2, "0")}${ampm}`
}
