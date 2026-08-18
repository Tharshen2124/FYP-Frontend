import { expect, type Page } from "@playwright/test"

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

/**
 * Signs up a fresh, uniquely-named user through the real /login UI (against
 * the live Rails backend) and logs them straight back in, landing on
 * /onboarding/roles. Protected routes (/dashboard, /onboarding/*) require a
 * real session now, so any test that visits them needs this first.
 */
export async function authenticateAsNewUser(page: Page) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const email = `e2e-${unique}@example.com`
  const username = `e2e_${unique}`
  const password = "password123"

  await page.goto("/login")
  await page.getByRole("button", { name: "Sign Up", exact: true }).click()
  await page.getByLabel("Email Address").fill(email)
  await page.getByLabel("Username").fill(username)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.locator("form").getByRole("button", { name: "Create Account" }).click()

  await page.locator("form").getByRole("button", { name: "Sign In", exact: true }).waitFor()
  await page.getByLabel("Email Address").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.locator("form").getByRole("button", { name: "Sign In", exact: true }).click()

  await page.waitForURL(/\/onboarding\/roles$/)

  return { email, username, password }
}

/** Adds one activity to each of the four renewal dimensions on the onboarding sharpen-the-saw step. */
export async function fillEveryDimension(page: Page) {
  const dimensions = ["Physical", "Spiritual", "Mental", "Social / Emotional"]
  for (const label of dimensions) {
    await page.getByPlaceholder(`Add a ${label.toLowerCase()} activity...`).fill(`${label} activity`)
    await page.getByRole("button", { name: `Add ${label} activity` }).click()
    await expect(page.getByText(`${label} activity`)).toBeVisible()
  }
}
