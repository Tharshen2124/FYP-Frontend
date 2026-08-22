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

// ---------------------------------------------------------------------------
// Card explanations
// ---------------------------------------------------------------------------

/**
 * The plain-English copy behind each card's "How does this work?" toggle.
 *
 * Kept together rather than inside the four components so they read as one voice, and so the
 * wording can be corrected in one place when a metric changes. Every card measures something a
 * new user has no reason to guess — a share is not a completion rate, and a dropped goal is not a
 * missed one — so each explains what its big number is *and* what it deliberately leaves out.
 */
export const CARD_INFO = {
  sharpen: [
    "Habit 7 asks you to renew yourself in four ways: physical, spiritual, mental and social/emotional. This card looks at the renewal tasks you ticked off over the weeks you picked, and shows how they were split between the four.",
    "The four percentages are slices of one pie, so they always add up to 100. An even 25% each means every kind of renewal got the same attention, which is what the dashed guide on the chart marks. A long spike means one kind is taking most of your time while another gets almost none.",
    "The big number rates how even the split is, not how much renewal you did. All four sharing equally scores 100%, three sharing scores about 67%, two about 33%, and everything in one dimension scores 0%.",
  ],
  roles: [
    "When you schedule a task you can attach it to a goal, and every goal belongs to one of your roles. This card adds those tasks up over the weeks you picked and shows, for each role, how many you finished out of how many you planned.",
    "It shows where your weeks actually go, and which roles you keep planning for but never get to. A long bar with a low percentage is a role you take on more of than you finish.",
    "The card leaves fixed appointments out, since they belong to no role. A role you have since archived still appears for any week it owned tasks in.",
  ],
  priority: [
    "While planning a week you can star tasks as that day's priority, the ones that matter most. This card takes a single week and shows whether you got them done.",
    "Each bar is a day. 100% means you completed every priority you starred that day, and a day with nothing starred stays empty. The Full days hit row underneath counts the days you cleared completely.",
    "The big number covers the whole week: every priority you completed, out of every one you starred.",
  ],
  completions: [
    "Each week you set goals under your roles. This card lists your five most recent planned weeks and how many of each week's goals you achieved.",
    "Goals you dropped part-way through a week sit in the Removed column, outside the ratio. Dropping a goal should not read as a failure, and it should not push your percentage up either.",
    "The big number is last week's rate.",
  ],
}
