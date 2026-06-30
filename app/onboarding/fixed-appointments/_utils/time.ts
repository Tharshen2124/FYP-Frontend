export function minsToStr(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`
}

export function strToMins(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + (m || 0)
}

export function fmtTime(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
}

export function snapMins(mins: number) {
  return Math.round(mins / 15) * 15
}
