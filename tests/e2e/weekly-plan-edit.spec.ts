import { test, expect, type Page } from "@playwright/test"
import { authenticateAsNewUser, completeOnboarding } from "./helpers"

/** The Monday of the local current week, the way lib/date.ts derives it. */
function currentMonday(): string {
  const d = new Date()
  d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Today's column, 0 = Monday … 6 = Sunday. */
const todayColumn = () => (new Date().getDay() + 6) % 7

/**
 * Opens the edit dialog behind a calendar card. The pencil only exists on hover, so the card has
 * to be hovered first — Playwright's actionability check runs before it would move the mouse.
 */
async function openCardEditor(page: Page, title: string) {
  const card = page.locator("[data-task], [data-appt]").filter({ hasText: title }).first()
  await card.hover()
  await page.getByRole("button", { name: `Edit ${title}` }).click()
  return page.getByRole("dialog")
}

const saveBar = (page: Page) => page.getByRole("button", { name: "Save Changes" })

test.describe("editing the week in progress", () => {
  test("the dashboard's Edit Weekly Plan button opens it on the current week", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)

    await page.getByRole("link", { name: "Edit Weekly Plan" }).click()
    await page.waitForURL(/\/weekly-plan\/edit$/)

    // Tasks first here, unlike the planning step, so the week's one task is what greets you.
    await expect(page.getByRole("tab", { name: "Scheduled Tasks" })).toHaveAttribute("data-state", "active")
    await expect(page.getByText("Deep work")).toBeVisible()

    await page.getByRole("tab", { name: "Fixed Appointments" }).click()
    await expect(page.getByText("Team standup")).toBeVisible()
  })

  // The whole reason this page is not step 3 of the wizard pointed at the current week.
  test("leaves every day open, where the planning step blocks the ones that have passed", async ({ page }) => {
    test.skip(todayColumn() === 0, "Nothing has passed yet on a Monday")

    await authenticateAsNewUser(page)
    await completeOnboarding(page)

    await page.goto(`/weekly-plan/schedule?week_start=${currentMonday()}`)
    await expect(page.locator("[data-day-column][aria-disabled]")).toHaveCount(todayColumn())

    await page.goto("/weekly-plan/edit")
    await expect(page.getByText("Deep work")).toBeVisible()
    await expect(page.locator("[data-day-column][aria-disabled]")).toHaveCount(0)
  })

  // What a user actually opens this page to do: Tuesday's task did not get done, so it moves.
  test("moves a task back onto a day that has passed, and it stays there", async ({ page }) => {
    test.skip(todayColumn() === 0, "Nothing has passed yet on a Monday")

    await authenticateAsNewUser(page)
    await completeOnboarding(page)
    await page.goto("/weekly-plan/edit")
    await expect(page.getByText("Deep work")).toBeVisible()

    // completeOnboarding schedules "Deep work" on today; Monday is behind us by the skip above.
    const modal = await openCardEditor(page, "Deep work")
    await modal.getByRole("button", { name: "Mon", exact: true }).click()
    await modal.getByRole("button", { name: "Save Changes" }).click()

    await expect(page.locator('[data-day-column="0"]').getByText("Deep work")).toBeVisible()

    await saveBar(page).click()
    await expect(page.getByText("Your week has been updated.")).toBeVisible()

    await page.reload()
    await expect(page.locator('[data-day-column="0"]').getByText("Deep work")).toBeVisible()
  })

  test("shows the Save bar only after a change, and Discard puts the week back", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)
    await page.goto("/weekly-plan/edit")
    await expect(page.getByText("Deep work")).toBeVisible()

    // Nothing has been touched, so there is nothing outstanding to save.
    await expect(saveBar(page)).toBeHidden()

    const modal = await openCardEditor(page, "Deep work")
    await modal.getByPlaceholder(/Work on project report/).fill("Deep work, rescheduled")
    await modal.getByRole("button", { name: "Save Changes" }).click()

    await expect(saveBar(page)).toBeVisible()
    await page.getByRole("button", { name: "Discard" }).click()

    await expect(saveBar(page)).toBeHidden()
    await expect(page.getByText("Deep work", { exact: true })).toBeVisible()
    await expect(page.getByText("Deep work, rescheduled")).toHaveCount(0)
  })

  // Nothing on this page writes as you go, so Back is the one gesture that can throw work away.
  test("asks before leaving with changes outstanding", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)
    await page.goto("/weekly-plan/edit")
    await expect(page.getByText("Deep work")).toBeVisible()

    const modal = await openCardEditor(page, "Deep work")
    await modal.getByPlaceholder(/Work on project report/).fill("Something else entirely")
    await modal.getByRole("button", { name: "Save Changes" }).click()
    await expect(saveBar(page)).toBeVisible()

    await page.getByRole("button", { name: "Back to Dashboard" }).click()
    await expect(page.getByText("Leave without saving?")).toBeVisible()

    await page.getByRole("button", { name: "Keep Editing" }).click()
    await expect(page).toHaveURL(/\/weekly-plan\/edit$/)

    await page.getByRole("button", { name: "Back to Dashboard" }).click()
    await page.getByRole("button", { name: "Discard and Leave" }).click()
    await page.waitForURL(/\/dashboard$/)

    // Discarded means discarded: the week is still the one that was stored.
    await expect(page.getByText("Deep work")).toBeVisible()
    await expect(page.getByText("Something else entirely")).toHaveCount(0)
  })

  // A clean exit should not ask anything at all.
  test("goes straight back when nothing has changed", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)
    await page.goto("/weekly-plan/edit")
    await expect(page.getByText("Deep work")).toBeVisible()

    await page.getByRole("button", { name: "Back to Dashboard" }).click()
    await page.waitForURL(/\/dashboard$/)
  })
})
