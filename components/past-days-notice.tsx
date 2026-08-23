import { Ban } from "lucide-react"

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

/** "Monday", "Monday and Tuesday", "Monday to Thursday" — the days sitting before `todayIdx`. */
function namePastDays(todayIdx: number): string {
  if (todayIdx === 1) return DAY_NAMES[0]
  if (todayIdx === 2) return `${DAY_NAMES[0]} and ${DAY_NAMES[1]}`
  return `${DAY_NAMES[0]} to ${DAY_NAMES[todayIdx - 1]}`
}

interface Props {
  /**
   * Today's column, 0 = Monday … 6 = Sunday; `-1` when the week on screen is not the current one
   * and `null` before the client clock resolves. Both of those mean nothing is blocked, and a
   * Monday has nothing before it — in all three cases this renders nothing rather than a notice
   * about days that are all still open.
   */
  todayIdx: number | null
  /** What the calendar below creates, for the sentence: "appointments", "tasks and appointments". */
  creates: string
}

/**
 * Says which days the calendar below has closed off, and why.
 *
 * The three calendar routes dim a past day, which reads as decoration until a click does nothing.
 * This is the sentence that turns the dimming into a stated rule, so the refusal is expected
 * rather than discovered.
 */
export function PastDaysNotice({ todayIdx, creates }: Props) {
  if (todayIdx == null || todayIdx < 1) return null

  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-md border border-border bg-muted/40 px-4 py-3">
      <Ban className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground font-serif">
        <span className="font-sans font-bold text-foreground">
          {namePastDays(todayIdx)} {todayIdx === 1 ? "has" : "have"} passed and {todayIdx === 1 ? "is" : "are"} blocked off.
        </span>{" "}
        A day that is already gone can&apos;t take new {creates} — schedule them from today onwards.
      </p>
    </div>
  )
}
