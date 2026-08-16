import type { Page } from "@playwright/test"

/**
 * The end-of-day check-in modal opens on /dashboard once the local clock passes the
 * configured check-in time (default 21:00) and no check-in has been recorded today. Its
 * dialog overlay swallows pointer events, so every test that clicks anything on the
 * dashboard fails when the suite happens to run in the evening.
 *
 * Marking today as already shown keeps the modal closed regardless of when the suite runs.
 *
 * Replace this with an API stub for §8.1 `alreadySubmitted` when Appendix A item 4 moves
 * the flag server-side — `eod_shown_date` disappears at that point.
 */
export async function suppressEndOfDayModal(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("eod_shown_date", new Date().toDateString())
  })
}
