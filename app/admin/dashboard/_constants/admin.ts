import type { StatusTone } from "../_types"

/** Rows per page in both tables. The server's own default, restated so the pager can say it. */
export const PER_PAGE = 25

/**
 * How long to wait after the last keystroke before searching. Long enough that typing an email
 * address is one request rather than twenty, short enough that it does not feel like a submit.
 */
export const SEARCH_DEBOUNCE_MS = 300

/**
 * The revenue bars. **One series, one colour** — the trend is a single measure over time, so there
 * is nothing for a second hue to distinguish, and the card's title already names what the bars are.
 * Checked against the card surface (`--card`, #130066) rather than assumed: it clears 3:1, which
 * is what stops a bar from reading as background at the short end of the axis.
 */
export const REVENUE_BAR = "#B13BFF"

/**
 * The status palette, kept apart from the role palette and from the chart's purple so a status
 * colour can never be mistaken for a series. Every one of these is drawn beside its own label —
 * see `StatusTone` — so the colour is a second reading of the word, never the only one.
 */
export const TONE_COLORS: Record<StatusTone, string> = {
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#d03b3b",
  // The design system's own muted text, for a state that is neither good nor bad: an account that
  // simply never subscribed is not a problem to be coloured.
  neutral: "#b8b8ff",
}

/**
 * Stripe's subscription statuses, sorted into the three tones this page distinguishes.
 *
 * Anything unlisted falls to `neutral` rather than throwing, because the server sends the raw
 * status: Stripe can add one, and a status nobody anticipated should show up greyed with its own
 * name on it, not crash the table or quietly disappear from the breakdown.
 */
export const SUBSCRIPTION_TONES: Record<string, StatusTone> = {
  active: "good",
  trialing: "good",
  past_due: "warning",
  incomplete: "warning",
  unpaid: "critical",
  incomplete_expired: "critical",
  canceled: "neutral",
  paused: "neutral",
}
