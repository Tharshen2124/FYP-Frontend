/** Index is a task's `day_of_week`, so this is the label lookup, not the identity. */
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/* Re-exported rather than repeated: the blue every calendar paints a fixed appointment, defined
   beside the role palette because no role and no dimension may take it. */
export { FIXED_COLOR } from "@/lib/role-colors"

/**
 * A scheduled task with no goal and no activity behind it.
 *
 * The planning UI never creates one — a task must link to a role goal or a Sharpen the Saw activity — but
 * the schema permits it, so the schedule says "Unlinked" rather than rendering an untinted chip
 * and leaving the reader to guess.
 */
export const UNLINKED_COLOR = "#94a3b8"

/** How many weeks the sidebar shows at a time, and how many more "Load older weeks" adds. */
export const WEEKS_PER_PAGE = 8
