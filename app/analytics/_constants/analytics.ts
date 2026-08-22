// ---------------------------------------------------------------------------
// Selector options
// ---------------------------------------------------------------------------

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** Monday-first, matching the backend's `day_of_week` indexing. */
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

// ---------------------------------------------------------------------------
// Window and defaults
// ---------------------------------------------------------------------------

/**
 * How many finished weeks are fetched on load. The whole page is filtered client-side from this
 * one request, so it is also how far back the From/To selectors can reach. 52 is the cap the API
 * already enforces on a range (`WeekScoped::MAX_RANGE_DAYS`), and a week is only counts, so a full
 * year is still a small payload.
 */
export const WEEKS_FETCHED = 52

/** Rows in the weekly goal completion card, which has no filter of its own. */
export const COMPLETION_WEEKS_SHOWN = 5

/** The span the two From/To cards open on: roughly the last month. */
export const DEFAULT_RANGE_WEEKS = 4
