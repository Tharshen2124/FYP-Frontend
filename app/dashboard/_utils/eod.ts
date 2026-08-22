import { DEFAULT_EOD_TIME } from "@/lib/eod"

/** "21:00" → 1260. `null` for anything that is not HH:MM inside a real day. */
function parseTimeOfDay(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (match === null) return null

  const hours = Number(match[1])
  const mins = Number(match[2])
  if (hours > 23 || mins > 59) return null

  return hours * 60 + mins
}

/**
 * Whether the check-in time the user set has passed.
 *
 * This is all the clock knows. Whether tonight has already been *dealt with* is a `check_ins` row
 * and lives on the weekly-plan response, so it is the same answer on every device — which is
 * exactly what the `localStorage` stamp this replaced could not do.
 *
 * The comparison stays a client decision, like every other date in this app: the server stores no
 * timezone, so it can say when the user wants prompting but never whether that moment has come.
 * A time it cannot parse falls back to the default rather than prompting at an hour nobody chose.
 */
export function isCheckInDue(now: Date, eodTime: string | null): boolean {
  const trigger = (eodTime === null ? null : parseTimeOfDay(eodTime)) ?? parseTimeOfDay(DEFAULT_EOD_TIME)!

  return now.getHours() * 60 + now.getMinutes() >= trigger
}
