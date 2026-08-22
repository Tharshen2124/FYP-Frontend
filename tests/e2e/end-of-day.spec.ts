import { test, expect } from "@playwright/test"
import {
  authenticateAsNewUser,
  loginAs,
  seedEodTimeNow,
  seedTaskToday,
  seedWeeklyPlan,
} from "./helpers"

/**
 * The End-of-Day check-in against the live Rails backend.
 *
 * Every other spec leaves the check-in time where `authenticateAsNewUser` puts it, out of the way
 * at 23:59. Here the modal opening is the thing under test, so each test moves it back to one
 * minute past midnight — due whenever the suite happens to run.
 *
 * Nothing about the check-in lives in the browser any more: the time is a column on the user and
 * "tonight has been dealt with" is a `check_ins` row, which is what these reloads are really
 * asserting.
 */

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

/** Today's column, 0 = Monday, the way lib/date.ts derives it. */
const todayIndex = (new Date().getDay() + 6) % 7

test.describe("end-of-day check-in", () => {
  test("writes today's tasks and reflection in one save", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedEodTimeNow(page)
    await seedWeeklyPlan(page)
    await seedTaskToday(page, "Check-in task")

    await page.goto("/dashboard")

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "End of Day" })).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Check-in task" })).toBeVisible()

    // The reflection is the whole of the gate: nothing else unlocks Save, and ticking does not.
    const save = dialog.getByRole("button", { name: "Save & Close" })
    await expect(save).toBeDisabled()

    await dialog.getByRole("button", { name: "Check-in task" }).click()
    await expect(dialog.getByRole("button", { name: "Check-in task" })).toHaveAttribute("aria-pressed", "true")
    await expect(save).toBeDisabled()

    await dialog.getByPlaceholder(/What went well/).fill("Got the report drafted before lunch.")
    await expect(save).toBeEnabled()
    await save.click()

    await expect(dialog).toHaveCount(0)

    // The timetable behind the modal agrees without a refetch.
    await expect(page.getByRole("button", { name: /^Check-in task,.*completed$/ })).toBeVisible()

    // The reload is what proves both writes landed, and that the day is stamped as checked in.
    await page.reload()
    await expect(page.getByRole("button", { name: /^Check-in task,.*completed$/ })).toBeVisible()
    await expect(page.getByRole("dialog")).toHaveCount(0)

    await page.goto("/evening-reflections")
    await page.getByRole("button", { name: `Edit ${DAYS[todayIndex]} reflection` }).click()
    await expect(page.getByPlaceholder("Today I reflected on…")).toHaveValue(
      "Got the report drafted before lunch."
    )
  })

  // Both surfaces write the same (week, day) row, and the check-in's PUT is an upsert. Opening on
  // a blank textarea would replace an entry written earlier in the day without saying so.
  test("prefills a reflection already written on /evening-reflections", async ({ page }) => {
    const written = "Wrote this at three in the afternoon, long before the check-in."

    await authenticateAsNewUser(page)
    await seedEodTimeNow(page)
    await seedWeeklyPlan(page)

    await page.goto("/evening-reflections")
    await page.getByRole("button", { name: `Create ${DAYS[todayIndex]} reflection` }).click()
    await page.getByPlaceholder("Today I reflected on…").fill(written)
    await page.getByRole("button", { name: "Save Reflection" }).click()
    await expect(page.getByRole("button", { name: `Edit ${DAYS[todayIndex]} reflection` })).toBeVisible()

    await page.goto("/dashboard")

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "End of Day" })).toBeVisible()
    await expect(dialog.getByPlaceholder(/What went well/)).toHaveValue(written)

    // Nothing was scheduled, which is a day the check-in still has something to ask about.
    await expect(dialog.getByText("No tasks were scheduled for today.")).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Save & Close" })).toBeEnabled()
  })

  // The reason any of this is a database row rather than a localStorage stamp. Both ways out of the
  // check-in have to hold, and only one of them is derivable from anything else: a saved night
  // leaves a reflection behind, a skipped one leaves nothing but this.
  test("a check-in on one device does not prompt on another", async ({ page, browser }) => {
    const { email, password } = await authenticateAsNewUser(page)
    await seedEodTimeNow(page)
    await seedWeeklyPlan(page)

    await page.goto("/dashboard")
    const dialog = page.getByRole("dialog")
    await dialog.getByPlaceholder(/What went well/).fill("Checked in from the laptop.")
    await dialog.getByRole("button", { name: "Save & Close" }).click()
    await expect(dialog).toHaveCount(0)

    const otherDevice = await browser.newContext()
    const otherPage = await otherDevice.newPage()
    try {
      await loginAs(otherPage, email, password)
      await otherPage.goto("/dashboard")

      // The timetable is what proves the page finished loading and simply chose not to prompt.
      await expect(otherPage.getByRole("heading", { name: /Schedule for/ })).toBeVisible()
      await expect(otherPage.getByRole("dialog")).toHaveCount(0)
    } finally {
      await otherDevice.close()
    }
  })

  test("a skip on one device does not prompt on another either", async ({ page, browser }) => {
    const { email, password } = await authenticateAsNewUser(page)
    await seedEodTimeNow(page)
    await seedWeeklyPlan(page)

    await page.goto("/dashboard")
    await page.getByRole("dialog").getByRole("button", { name: "Skip for now" }).click()
    await expect(page.getByRole("dialog")).toHaveCount(0)

    const otherDevice = await browser.newContext()
    const otherPage = await otherDevice.newPage()
    try {
      await loginAs(otherPage, email, password)
      await otherPage.goto("/dashboard")

      await expect(otherPage.getByRole("heading", { name: /Schedule for/ })).toBeVisible()
      await expect(otherPage.getByRole("dialog")).toHaveCount(0)
    } finally {
      await otherDevice.close()
    }
  })

  // The server refuses a reflection for a week that was never planned, so prompting for one would
  // be a dead end. /dashboard offers the planning flow instead.
  test("does not open on a week with no plan", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedEodTimeNow(page)

    await page.goto("/dashboard")

    await expect(page.getByRole("heading", { name: "This week isn't planned yet" })).toBeVisible()
    await expect(page.getByRole("dialog")).toHaveCount(0)
  })

  test("skipping closes without writing, and does not ask again today", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedEodTimeNow(page)
    await seedWeeklyPlan(page)
    await seedTaskToday(page, "Skipped task")

    await page.goto("/dashboard")

    const dialog = page.getByRole("dialog")
    await dialog.getByRole("button", { name: "Skipped task" }).click()
    await dialog.getByRole("button", { name: "Skip for now" }).click()
    await expect(dialog).toHaveCount(0)

    // The tick was never sent, and the skip was recorded, so tonight has had its one turn.
    await page.reload()
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await expect(page.getByRole("button", { name: /^Skipped task,.*completed$/ })).toHaveCount(0)
    await expect(page.getByRole("button", { name: /^Skipped task,/ })).toBeVisible()
  })
})
