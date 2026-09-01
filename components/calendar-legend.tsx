import { Star } from "lucide-react"
import { WEEKLY_PRIORITY_COLOR } from "@/lib/role-colors"

/** What a drawn block belongs to. `none` is the schema-permitted, UI-unreachable unlinked task. */
export type LegendKind = "goal" | "activity" | "fixed" | "none"

/**
 * One drawn block's category, as its calendar reports it. Callers pass one per block and let the
 * legend fold them — the dedup rule is the legend's business, not each route's.
 */
export interface LegendCategory {
  kind: LegendKind
  /** The role's name, the dimension's display label, or what an uncategorised block is called. */
  label: string
  /** The category's own colour, never the reserved yellow a weekly priority paints over it. */
  color: string
}

interface Props {
  /** One entry per block on the grid. Duplicates are expected and folded. */
  categories: LegendCategory[]
  hasWeeklyPriority: boolean
  hasDailyPriority: boolean
  /** The dashboard's current-time rule, which the planning calendars do not draw. */
  showNow?: boolean
}

/** The rows, in the order they are shown. Roles and dimensions are the two vocabularies a reader
 *  has to tell apart, so they get a row each and are named. Fixed appointments and the unlinked
 *  task share the last: neither belongs to a role or a dimension, which is all that row says. */
const ROWS: { key: string; title: string; kinds: LegendKind[] }[] = [
  { key: "goal", title: "Role goals", kinds: [ "goal" ] },
  { key: "activity", title: "Sharpen the Saw", kinds: [ "activity" ] },
  { key: "other", title: "Other", kinds: [ "fixed", "none" ] },
]

/** A miniature of the block it explains — the same tinted fill and solid left edge a card has. */
function Swatch({ color }: { color: string }) {
  return (
    <span
      className="w-3 h-3 rounded-sm shrink-0"
      style={{ backgroundColor: `${color}40`, borderLeft: `3px solid ${color}` }}
    />
  )
}

/** A row: what kind of thing these entries are, then the entries. The title is a fixed column so
 *  the rows line up and can be read down as well as across. */
function LegendRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground/70 w-28 shrink-0">
        {title}
      </span>
      {children}
    </div>
  )
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-serif">{children}</span>
  )
}

/**
 * Folds one entry per drawn block into the distinct categories on the grid.
 *
 * Keyed by kind *and* label rather than by colour: the label is the identity, and two categories
 * that somehow share a colour must still get an entry each rather than silently becoming one.
 */
function fold(categories: LegendCategory[]): (LegendCategory & { key: string })[] {
  const seen = new Map<string, LegendCategory & { key: string }>()
  for (const category of categories) {
    const key = `${category.kind}:${category.label}`
    if (!seen.has(key)) seen.set(key, { ...category, key })
  }
  return [ ...seen.values() ]
}

/**
 * What the colours on a weekly calendar mean, for the week actually on screen.
 *
 * It names the grid's real roles and dimensions rather than claiming every task is one purple.
 * That claim was true while a calendar drew all tasks alike; it stopped being true once a card took
 * the colour of the role or the dimension behind it, and a static legend then said the one thing
 * the reader could check and find wrong.
 *
 * Only the categories the grid uses are listed, the rule /history's footer legend already follows:
 * explaining a swatch that is nowhere on the calendar invites exactly the question a legend exists
 * to answer. An empty calendar therefore shows only the rows that still apply.
 */
export function CalendarLegend({
  categories,
  hasWeeklyPriority,
  hasDailyPriority,
  showNow = false,
}: Props) {
  const folded = fold(categories)

  return (
    /* A landmark rather than a bare div: the legend explains the grid beside it, and a reader
       moving by region should be able to reach the key without walking the whole calendar. */
    <section aria-label="Calendar legend" className="space-y-2 mb-4">
      {ROWS.map(row => {
        const entries = folded.filter(entry => row.kinds.includes(entry.kind))
        const withNow = row.key === "other" && showNow
        if (entries.length === 0 && !withNow) return null

        return (
          <LegendRow key={row.key} title={row.title}>
            {entries.map(entry => (
              <Item key={entry.key}>
                <Swatch color={entry.color} />
                {entry.label}
              </Item>
            ))}
            {/* The "Now" rule has no category of its own to sit in, and is not a colour claim at
                all — it borrows this row rather than earning a fourth. */}
            {withNow && (
              <Item>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="w-4 border-t-2 border-primary" />
                </span>
                Now
              </Item>
            )}
          </LegendRow>
        )
      })}

      {/* The reserved yellow and the star cut across the rows above rather than sitting in them:
          either can land on a task of any category. They are two entries because they are two
          claims — a yellow card is work on a weekly-priority goal, a star is a task picked out for
          its day, whatever colour the card underneath it is. */}
      {(hasWeeklyPriority || hasDailyPriority) && (
        <LegendRow title="Priority">
          {hasWeeklyPriority && (
            <Item>
              <Swatch color={WEEKLY_PRIORITY_COLOR} />
              Weekly priority goal
            </Item>
          )}
          {hasDailyPriority && (
            <Item>
              <Star className="w-3 h-3 shrink-0 fill-current" style={{ color: WEEKLY_PRIORITY_COLOR }} />
              Daily priority
            </Item>
          )}
        </LegendRow>
      )}
    </section>
  )
}
