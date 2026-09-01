import { test, expect, type Page } from "@playwright/test"
import {
  authenticateAsNewUser,
  grantPremium,
  loginAsPremium,
  seedThisWeekPlanViaApi,
  seedWeeklyPlan,
} from "./helpers"

/**
 * Evening reflections against the live Rails backend.
 *
 * The last test calls Google Gemini for real, so `bin/rails server` must be running with
 * GOOGLE_GEMINI_API_KEY loaded from habitflow-backend/.env.local. That key is on the free tier —
 * five requests a minute — so re-running this file in quick succession can legitimately come back
 * as "the summary service is busy", which is the app behaving correctly rather than a broken test.
 */

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

/** The Monday of the local current week, the way lib/date.ts derives it. */
function currentMonday(): string {
  const d = new Date()
  d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Local noon, `days` days on from `weekStart`. Used to age a week out of its editable window. */
function noonAfter(weekStart: string, days: number): Date {
  const d = new Date(`${weekStart}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d
}

/** A week with a pattern deliberately planted in it, for the model to find in the last test. */
const PLANTED_WEEK = [
  "Started the week clear-headed and shipped the first slice of the report before lunch.",
  "Lost the whole afternoon to meetings; the deep work I had planned never happened.",
  "Blocked the morning out and got the report drafted. Protecting the block was the difference.",
  "Meetings crept back in and I let them. Tired by the evening and short with people.",
  "Went for a run before starting and the day held together much better.",
  "Slower day. Caught up on reading and did not feel guilty about it.",
  "Planned next week properly for the first time in a while and went to bed early.",
]

async function writeReflection(page: Page, dayIndex: number, text: string) {
  await page.getByRole("button", { name: `Create ${DAYS[dayIndex]} reflection` }).click()
  await page.getByPlaceholder("Today I reflected on…").fill(text)
  await page.getByRole("button", { name: "Save Reflection" }).click()
  await expect(page.getByRole("button", { name: `Edit ${DAYS[dayIndex]} reflection` })).toBeVisible()
}

/**
 * The whole week written, leaving alone any day that already is.
 *
 * The skip matters for the summary test alone, and only because the account it runs as is the
 * seeded premium one — the same reuse that makes "generated once per week and never again"
 * testable at all also means a second run this week finds Monday written and no Create to press.
 */
async function writeWholeWeek(page: Page, texts: string[] = PLANTED_WEEK) {
  /* The grid has to be on screen before `count()` below is meaningful — `count()` is the one
     locator call that does not auto-wait. On a slow first paint every day reads as "no Create
     button", and the else-branch then waits for an Edit that an unwritten day will never have. */
  await expect(page.getByRole("button", { name: /(Create|Edit|View) Monday reflection/ })).toBeVisible()

  for (let day = 0; day < 7; day++) {
    if (await page.getByRole("button", { name: `Create ${DAYS[day]} reflection` }).count()) {
      await writeReflection(page, day, texts[day])
    } else {
      await expect(page.getByRole("button", { name: `Edit ${DAYS[day]} reflection` })).toBeVisible()
    }
  }
}


test.describe("evening reflections", () => {
  // A reflection is a real row now rather than page state, so the reload is the assertion.
  test("creates a reflection from + Create and persists it", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto("/evening-reflections")

    await expect(page).toHaveURL(new RegExp(`week_start=${currentMonday()}`))
    await writeReflection(page, 0, "A good day of deep work.")
    await expect(page.getByText("A good day of deep work.")).toBeVisible()

    await page.reload()
    await expect(page.getByText("A good day of deep work.")).toBeVisible()
  })

  // Every day of the live week is writable, in any order. Someone reflecting on a Thursday must
  // still be able to fill in Monday, and writing Sunday early is not an error.
  test("allows writes for every day of the current week, out of order", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto("/evening-reflections")

    for (const day of [6, 0, 3]) await writeReflection(page, day, `${DAYS[day]} went like this.`)

    await expect(page.getByRole("button", { name: "Edit Sunday reflection" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Create Tuesday reflection" })).toBeVisible()
    // Read off the sidebar badge rather than the summary card's "3 of 7 written", which now sits
    // behind the paid gate and is not shown to a free account at all.
    await expect(page.locator("aside li button").first()).toContainText("3/7")
  })

  // A reflection hangs off a weekly plan, and writing one deliberately does not create that plan:
  // a plan row existing is the app's only answer to "is this week planned?".
  test("offers to plan a week that has none instead of writing into it", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/evening-reflections")

    await expect(page.getByText("You haven't planned this week yet", { exact: false })).toBeVisible()
    await expect(page.getByRole("button", { name: /^Create .* reflection$/ })).toHaveCount(0)
  })

  // Planning a week that has already gone would change nothing that happened in it, and there
  // would still be nothing to reflect against afterwards — so the offer is not made.
  test("does not offer to plan a week that has already passed", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)

    const lastWeek = new Date(`${currentMonday()}T00:00:00`)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonday = `${lastWeek.getFullYear()}-${String(lastWeek.getMonth() + 1).padStart(2, "0")}-${String(lastWeek.getDate()).padStart(2, "0")}`

    await page.goto(`/evening-reflections?week_start=${lastMonday}`)

    await expect(page.getByText("You didn't plan this week", { exact: false })).toBeVisible()
    await expect(page.getByRole("link", { name: /Plan this week/ })).toHaveCount(0)
    // Nothing was written, so there is nothing to say is locked either.
    await expect(page.getByText("This week has ended", { exact: false })).toHaveCount(0)
  })

  /**
   * "Past weeks are read-only" is a client-side rule, because the client is the only party that
   * knows the user's local date — the server stores no timezone and keeps only a loose backstop.
   * Moving the browser's clock forward is therefore the honest way to test it: the week is written
   * while it is genuinely current, and only then does it become last week.
   *
   * Two weeks rather than one so the assertion holds whichever day the suite runs on.
   */
  test("only allows viewing, never creating, once the week has passed", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    const week = currentMonday()

    await page.goto("/evening-reflections")
    await writeReflection(page, 0, "Monday went well, all things considered.")
    await writeReflection(page, 2, "Wednesday was the productive one.")

    await page.clock.setFixedTime(noonAfter(week, 14))
    await page.goto(`/evening-reflections?week_start=${week}`)

    await expect(page.getByText("This week has ended", { exact: false })).toBeVisible()
    await expect(page.getByRole("button", { name: /^Create .* reflection$/ })).toHaveCount(0)
    await expect(page.getByRole("button", { name: /^Edit .* reflection$/ })).toHaveCount(0)

    // What was written is still readable, and the dialog offers no way to change it.
    await page.getByRole("button", { name: "View Monday reflection" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByText("Monday went well, all things considered.")).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Save Reflection" })).toHaveCount(0)
    await expect(dialog.getByRole("button", { name: "Close reflection" })).toBeVisible()
  })

  // The AI summary is a paid feature, so a free account is offered the upgrade where the button
  // would be — not the "write all 7 reflections" line, which would be simply wrong for someone who
  // has written all seven and just has not paid.
  test("offers the upgrade in place of the summary button for a free account", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto("/evening-reflections")

    await expect(page.getByRole("heading", { name: "Weekly Summary" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Generate Summary" })).toHaveCount(0)
    await expect(page.getByText(/Read your seven reflections back as one picture/)).toBeVisible()
    await expect(page.getByText(/Write all 7 daily reflections/)).toHaveCount(0)
  })

  // The summary reads the whole week, so a partial week has nothing coherent to summarise.
  test("unlocks the AI summary only once all seven reflections are written", async ({ page }) => {
    await authenticateAsNewUser(page)
    // The reflections, the counts and the unlock are all the live backend's; only the tier flag
    // riding on that same response is changed, since no account this suite can sign up is paid.
    await grantPremium(page, "**/weekly-plans/evening-reflections*")
    await seedWeeklyPlan(page)
    await page.goto("/evening-reflections")

    const generate = page.getByRole("button", { name: "Generate Summary" })
    await expect(generate).toBeDisabled()

    for (let day = 0; day < 6; day++) await writeReflection(page, day, PLANTED_WEEK[day])
    await expect(page.getByText("6 of 7 written")).toBeVisible()
    await expect(generate).toBeDisabled()

    await writeReflection(page, 6, PLANTED_WEEK[6])
    await expect(generate).toBeEnabled()
  })

  /**
   * A real call to Gemini Flash. Asserted on substance rather than wording: that a model actually
   * read the seven entries, that it found the pattern planted across them, and that the answer was
   * stored once and can never be regenerated.
   */
  test("generates the AI summary from the seven reflections, once and only once", async ({ page }) => {
    test.slow()

    // The one test that needs a genuinely paid account against the real backend: generating is a
    // POST the server refuses for a free account, and flipping a flag on a *read* cannot change
    // that. The seeded account carries state between runs, which is exactly what "once per week"
    // means — so the first run in a given week does the real Gemini call and later runs assert the
    // stored answer is still there and still unrepeatable.
    await loginAsPremium(page)
    await page.goto("/dashboard")
    await seedThisWeekPlanViaApi(page)
    await page.goto("/evening-reflections")
    await writeWholeWeek(page)

    const generate = page.getByRole("button", { name: "Generate Summary" })
    if (await generate.count()) await generate.click()

    const summary = page.locator("[data-weekly-summary]")
    await expect(summary).toBeVisible({ timeout: 90_000 })

    const text = (await summary.innerText()).trim()
    expect(text.length).toBeGreaterThan(200)
    // The planted pattern is protected mornings against encroaching meetings; a real reading of
    // the week cannot miss it, while any single wording of it would be flaky to assert on.
    expect(text).toMatch(/morning|meeting|deep work|block/i)

    // Once only, forever — and it survives a reload, which is what proves it was stored rather
    // than held in page state the way the mock used to be.
    await expect(page.getByRole("button", { name: /Generate Summary|Regenerate/ })).toHaveCount(0)
    await page.reload()
    await expect(summary).toBeVisible()
    await expect(page.getByRole("button", { name: /Generate Summary|Regenerate/ })).toHaveCount(0)
    await expect(page.getByText("Generated", { exact: false })).toBeVisible()
  })

  test("moves between weeks from the sidebar and jumps to one by date", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto("/evening-reflections")

    const lastWeek = new Date(`${currentMonday()}T00:00:00`)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonday = `${lastWeek.getFullYear()}-${String(lastWeek.getMonth() + 1).padStart(2, "0")}-${String(lastWeek.getDate()).padStart(2, "0")}`

    await page.locator("aside li button").nth(1).click()
    await expect(page).toHaveURL(new RegExp(`week_start=${lastMonday}`))

    // Any date resolves to the week containing it, so the user picks a day, not a Monday.
    const wednesday = new Date(`${currentMonday()}T00:00:00`)
    wednesday.setDate(wednesday.getDate() + 2)
    const wednesdayValue = `${wednesday.getFullYear()}-${String(wednesday.getMonth() + 1).padStart(2, "0")}-${String(wednesday.getDate()).padStart(2, "0")}`

    await page.getByLabel("Jump to a week").fill(wednesdayValue)
    await expect(page).toHaveURL(new RegExp(`week_start=${currentMonday()}`))
  })
})
