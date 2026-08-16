import { test, expect, type Page } from "@playwright/test"
import { suppressEndOfDayModal, authenticateAsNewUser } from "./helpers"

test.beforeEach(async ({ page }) => {
  await suppressEndOfDayModal(page)
  await authenticateAsNewUser(page)
})

/**
 * Walks the five-step onboarding flow, checking that each step's Next button
 * stays disabled until its own gate is satisfied.
 *
 * `exact: true` on "Next" matters: the Next.js dev-tools button in the dev
 * server overlay also matches a loose "Next" name.
 */

const nextLink = (page: Page) => page.getByRole("link", { name: "Next", exact: true })
const nextButton = (page: Page) => page.getByRole("button", { name: "Next", exact: true })

/** The card row that renders a given goal/activity, used to scope hover actions. */
const rowFor = (page: Page, text: string) =>
  page.locator("div.group").filter({ hasText: text }).first()

async function fillEveryDimension(page: Page) {
  const dimensions = ["Physical", "Spiritual", "Mental", "Social / Emotional"]
  for (const label of dimensions) {
    await page.getByPlaceholder(`Add a ${label.toLowerCase()} activity...`).fill(`${label} activity`)
    await page.getByRole("button", { name: `Add ${label} activity` }).click()
    await expect(page.getByText(`${label} activity`)).toBeVisible()
  }
}

/** Clicks a calendar column at roughly the given hour offset to open the add modal. */
async function clickSlot(page: Page, dayIndex: number, hoursFromStart: number) {
  const column = page.locator(`[data-day-column="${dayIndex}"]`)
  const box = (await column.boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + hoursFromStart * 64 + 10)
}

test.describe("onboarding", () => {
  test("step 1 gates Next on having a role and a goal", async ({ page }) => {
    await page.goto("/onboarding/roles")

    // Seeded with 2 roles / 3 goals, so Next is live immediately.
    await expect(page.getByText("3 Goals")).toBeVisible()
    await expect(nextLink(page)).toHaveAttribute("href", "/onboarding/sharpen-the-saw")

    // Removing every role disables it.
    await page.getByRole("button", { name: "Delete Professional" }).click()
    await page.getByRole("button", { name: "Delete Parent" }).click()
    await expect(nextButton(page)).toBeDisabled()
  })

  test("step 1 adds a role and a goal", async ({ page }) => {
    await page.goto("/onboarding/roles")

    await page.getByRole("button", { name: "Add New Role" }).click()
    await page.getByLabel("Role Name").fill("Athlete")
    await page.getByRole("button", { name: "Add Role" }).click()

    await expect(page.getByRole("heading", { name: "Athlete" })).toBeVisible()

    await page.getByPlaceholder("Add a goal for this role...").last().fill("Run a 10k")
    await page.getByRole("button", { name: "Add goal to Athlete" }).click()

    await expect(page.getByText("Run a 10k")).toBeVisible()
    await expect(page.getByText("4 Goals")).toBeVisible()
  })

  test("step 1 confirms before deleting a goal", async ({ page }) => {
    await page.goto("/onboarding/roles")

    const row = rowFor(page, "Mentor junior team member")
    await row.hover()
    await row.getByRole("button", { name: "Delete goal" }).click()

    await expect(page.getByText("Delete Goal?")).toBeVisible()
    await page.getByRole("button", { name: "Delete Goal", exact: true }).click()

    await expect(page.getByText("Mentor junior team member")).toHaveCount(0)
    await expect(page.getByText("2 Goals")).toBeVisible()
  })

  test("step 1 keeps the goal when the delete dialog is cancelled", async ({ page }) => {
    await page.goto("/onboarding/roles")

    const row = rowFor(page, "Mentor junior team member")
    await row.hover()
    await row.getByRole("button", { name: "Delete goal" }).click()
    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByText("Mentor junior team member")).toBeVisible()
    await expect(page.getByText("3 Goals")).toBeVisible()
  })

  test("step 2 gates Next until every dimension has an activity", async ({ page }) => {
    await page.goto("/onboarding/sharpen-the-saw")

    await expect(nextButton(page)).toBeDisabled()
    await expect(page.getByText("Add at least one renewal activity")).toBeVisible()

    await fillEveryDimension(page)

    await expect(nextLink(page)).toHaveAttribute("href", "/onboarding/fixed-appointments")
  })

  test("step 3 gates Next until an appointment exists, then adds one", async ({ page }) => {
    await page.goto("/onboarding/fixed-appointments")

    await expect(nextButton(page)).toBeDisabled()

    await clickSlot(page, 0, 3)
    await expect(page.getByText("Add Fixed Appointment")).toBeVisible()

    await page.getByRole("textbox", { name: "Appointment" }).fill("Team standup")
    await page.getByRole("button", { name: "Add Appointment" }).click()

    await expect(page.getByText("Team standup")).toBeVisible()
    await expect(nextLink(page)).toHaveAttribute("href", "/onboarding/schedule-tasks")
  })

  test("step 3 rejects an end time that is not after the start", async ({ page }) => {
    await page.goto("/onboarding/fixed-appointments")

    await clickSlot(page, 1, 2)
    await page.getByRole("textbox", { name: "Appointment" }).fill("Bad times")
    await page.locator("#appt-from").fill("10:00")
    await page.locator("#appt-to").fill("09:00")

    await expect(page.getByText("Must be after start time")).toBeVisible()
    await expect(page.getByRole("button", { name: "Add Appointment" })).toBeDisabled()
  })

  test("step 4 requires a linked goal before a task can be saved", async ({ page }) => {
    await page.goto("/onboarding/schedule-tasks")

    await expect(nextButton(page)).toBeDisabled()
    // Fixed appointments carried in from step 3 are shown but locked.
    await expect(page.getByText("Fixed Appointments").first()).toBeVisible()

    await clickSlot(page, 2, 5)
    await expect(page.getByText("Add Task", { exact: true }).first()).toBeVisible()

    await page.getByPlaceholder(/Work on project report/).fill("Deep work")
    // Save stays disabled while no goal is selected.
    await expect(page.getByRole("button", { name: "Add Task", exact: true })).toBeDisabled()
  })

  test("step 5 completes the flow into the dashboard", async ({ page }) => {
    await page.goto("/onboarding/complete")

    await expect(page.getByRole("heading", { name: /You're Set!/ })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Evening Reflection", exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: "End-of-Day Check-in" })).toBeVisible()

    // The final step's Next button completes onboarding via the backend rather
    // than being a plain link, so it renders as a button, not a link.
    await page.getByRole("button", { name: "Next", exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test("every step shows the stepper at the right position", async ({ page }) => {
    const steps: [string, string][] = [
      ["/onboarding/roles", "Roles & Goals"],
      ["/onboarding/sharpen-the-saw", "Sharpen the Saw"],
      ["/onboarding/fixed-appointments", "Fixed Appointments"],
      ["/onboarding/schedule-tasks", "Schedule Tasks"],
      ["/onboarding/complete", "You're Set!"],
    ]

    for (const [url, label] of steps) {
      await page.goto(url)
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
    }
  })
})
