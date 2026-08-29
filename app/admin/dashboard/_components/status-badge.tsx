import { TONE_COLORS } from "../_constants/admin"
import type { StatusTone } from "../_types"

interface Props {
  tone: StatusTone
  label: string
}

/**
 * A state, said in words with a colour beside them.
 *
 * The label is not optional and the dot is not the badge: a status rendered as colour alone is
 * unreadable to a colourblind reader and ambiguous to everyone else, since "amber" does not say
 * whether a subscription is past due or merely incomplete. The colour is a second reading of the
 * word, never the only one — which is also why the same three tones can serve both tables here.
 */
export function StatusBadge({ tone, label }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: TONE_COLORS[tone] }}
        aria-hidden
      />
      <span className="text-foreground">{label}</span>
    </span>
  )
}
