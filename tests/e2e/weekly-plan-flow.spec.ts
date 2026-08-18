import { test, expect, type Page } from "@playwright/test"
import { authenticateAsNewUser, fillEveryDimension } from "./helpers"

const nextLink = (page: Page) => page.getByRole("link", { name: "Next", exact: true })
const nextButton = (page: Page) => page.getByRole("button", { name: "Next", exact: true })

test.describe("weekly plan", () => {
  test("goals step gates Next until a goal is selected", async ({ page }) => {
    await page.goto("/weekly-plan/goals")

    await expect(nextButton(page)).toBeDisabled()
    await expect(page.getByText("Select at least one goal")).toBeVisible()

    await page.getByText("Complete quarterly project milestone").click()

    await expect(nextLink(page)).toHaveAttribute("href", "/weekly-plan/sharpen-the-saw")
  })

  test("goals step accepts a one-off weekly goal", async ({ page }) => {
    await page.goto("/weekly-plan/goals")

    await page.getByPlaceholder("Add a one-off goal just for this week...").first().fill("Ship the FYP demo")
    await page.keyboard.press("Enter")

    await expect(page.getByText("Ship the FYP demo")).toBeVisible()
    await expect(page.getByText("This week").first()).toBeVisible()
    await expect(nextLink(page)).toBeVisible()
  })

  test("goals step reads roles from the flow-level mock data", async ({ page }) => {
    await page.goto("/weekly-plan/goals")

    for (const role of ["Professional", "Parent", "Health"]) {
      await expect(page.getByRole("heading", { name: role })).toBeVisible()
    }
  })

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
