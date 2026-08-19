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

/** Clicks a calendar column at roughly the given hour offset to open its add modal. */
export async function clickSlot(page: Page, dayIndex: number, hoursFromStart: number) {
  const column = page.locator(`[data-day-column="${dayIndex}"]`)
  const box = (await column.boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + hoursFromStart * 64 + 10)
}

/**
 * Runs step 1 only, which is enough to bring a weekly plan into existence: submitting the roles
 * page is the first request that carries a `week_start`, and the backend creates the plan on
 * first use. The plan has goals but no scheduled items.
 */
export async function seedWeeklyPlan(page: Page) {
  await page.goto("/onboarding/roles")
  // The page is seeded with two roles and three goals, so Next is live immediately.
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.waitForURL(/\/onboarding\/sharpen-the-saw$/)
}

/**
 * Walks the whole onboarding flow against the live backend and lands on /dashboard, leaving the
 * user with a real weekly plan: three goals, four renewal activities, one fixed appointment
 * ("Team standup", Monday) and one goal-linked task ("Deep work", Wednesday).
 *
 * Used by tests that need a dashboard with something on it.
 */
export async function completeOnboarding(page: Page) {
  await seedWeeklyPlan(page)

  await fillEveryDimension(page)
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.waitForURL(/\/onboarding\/fixed-appointments$/)

  await clickSlot(page, 0, 3)
  await page.getByRole("textbox", { name: "Appointment" }).fill("Team standup")
  await page.getByRole("button", { name: "Add Appointment" }).click()
  await expect(page.getByText("Team standup")).toBeVisible()
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.waitForURL(/\/onboarding\/schedule-tasks$/)

  await clickSlot(page, 2, 5)
  const taskModal = page.getByRole("dialog")
  await taskModal.getByPlaceholder(/Work on project report/).fill("Deep work")
  await taskModal.getByRole("button", { name: "Professional", exact: true }).click()
  await taskModal.getByRole("button", { name: "Complete quarterly project milestone" }).click()
  await taskModal.getByRole("button", { name: "Add Task", exact: true }).click()
  await expect(page.getByText("Deep work")).toBeVisible()
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.waitForURL(/\/onboarding\/complete$/)

  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.waitForURL(/\/dashboard$/)
}
