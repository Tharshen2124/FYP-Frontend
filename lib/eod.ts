/**
 * When the End-of-Day check-in appears if the user has never chosen a time.
 *
 * The real default is the `users.eod_time` column, which every response carries — this is only what
 * `/settings` shows in the moment before that response lands. Whether tonight has already been
 * dealt with is not here at all any more: it is a `check_ins` row, so it is the same answer on
 * every device the user opens the dashboard on.
 */
export const DEFAULT_EOD_TIME = "21:00"
