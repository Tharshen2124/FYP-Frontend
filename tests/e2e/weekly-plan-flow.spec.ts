import { test, expect, type Page } from "@playwright/test"
import { authenticateAsNewUser, fillEveryDimension, seedWeeklyPlan } from "./helpers"

const nextLink = (page: Page) => page.getByRole("link", { name: "Next", exact: true })
const nextButton = (page: Page) => page.getByRole("button", { name: "Next", exact: true })

test.describe("weekly plan goals step (API-backed)", () => {
  test("points a user with no roles at the roles page", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/weekly-plan/goals")

    await expect(page.getByText("You have no active roles yet.")).toBeVisible()
    await expect(nextButton(page)).toBeDisabled()
  })

  test("lists this week's roles with the goals already added", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto("/weekly-plan/goals")

    for (const role of ["Professional", "Parent"]) {
      await expect(page.getByRole("heading", { name: role })).toBeVisible()
    }
    // Onboarding planned the current week, so its goals show as committed rather than as
    // carry-forward candidates — those come from the week before.
    await expect(page.getByText("Complete quarterly project milestone")).toBeVisible()
    await expect(page.getByText("Added").first()).toBeVisible()
  })

  test("stages a new goal and saves it on Next", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto("/weekly-plan/goals")

    await page.getByPlaceholder("Add a new goal for this week...").first().fill("Draft the report")
    await page.getByRole("button", { name: "Add goal to Professional" }).click()
    await expect(page.getByText("Draft the report")).toBeVisible()

    await nextButton(page).click()
    await page.waitForURL(/\/weekly-plan\/sharpen-the-saw$/)

    await page.goto("/roles")
    await expect(page.getByText("Draft the report")).toBeVisible()
  })
})

test.describe("weekly plan", () => {
  test("schedule step offers both tabs and gates Next on a task", async ({ page }) => {
    await page.goto("/weekly-plan/schedule")

    await expect(page.getByRole("tab", { name: "Fixed Appointments" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Scheduled Tasks" })).toBeVisible()
    await expect(nextButton(page)).toBeDisabled()

    await page.getByRole("tab", { name: "Scheduled Tasks" }).click()
    await expect(page.getByRole("tab", { name: "Scheduled Tasks" })).toHaveAttribute("data-state", "active")
  })
})

test.describe("weekly plan renewal step (API-backed)", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/onboarding/sharpen-the-saw")
    await fillEveryDimension(page)
    await page.getByRole("button", { name: "Next", exact: true }).click()
    await page.waitForURL(/\/onboarding\/fixed-appointments$/)
  })

  test("renewal step gates Next until an activity is selected", async ({ page }) => {
    await page.goto("/weekly-plan/sharpen-the-saw")

    await expect(nextButton(page)).toBeDisabled()
    await expect(page.getByText("Select at least one activity")).toBeVisible()

    await page.getByRole("button", { name: /Physical activity/ }).click()

    await expect(nextLink(page)).toHaveAttribute("href", "/weekly-plan/schedule")
  })

  test("renewal step shows all four dimensions with their activities", async ({ page }) => {
    await page.goto("/weekly-plan/sharpen-the-saw")

    for (const dim of ["Physical", "Spiritual", "Mental", "Social / Emotional"]) {
      await expect(page.getByRole("heading", { name: dim })).toBeVisible()
    }
    await expect(page.getByRole("button", { name: /Physical activity/ })).toBeVisible()
  })
})
