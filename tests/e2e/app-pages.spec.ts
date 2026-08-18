import { test, expect } from "@playwright/test"
import { suppressEndOfDayModal, authenticateAsNewUser } from "./helpers"

test.beforeEach(async ({ page }) => {
  await suppressEndOfDayModal(page)
})

test.describe("roles management", () => {
  test("confirms before deleting a role that still has goals", async ({ page }) => {
    await page.goto("/roles")

    await page.getByRole("button", { name: "Delete Professional" }).click()
    await expect(page.getByText("Delete Role?")).toBeVisible()
    await expect(page.getByRole("alertdialog").getByText("2 goals")).toBeVisible()

    await page.getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByRole("heading", { name: "Professional" })).toBeVisible()
  })

  test("deletes an empty role without confirmation", async ({ page }) => {
    await page.goto("/roles")

    await page.getByRole("button", { name: "Add New Role" }).click()
    await page.getByLabel("Role Name").fill("Temp")
    await page.getByRole("button", { name: "Add Role" }).click()
    await expect(page.getByRole("heading", { name: "Temp" })).toBeVisible()

    await page.getByRole("button", { name: "Delete Temp" }).click()
    await expect(page.getByRole("heading", { name: "Temp" })).toHaveCount(0)
    await expect(page.getByText("Delete Role?")).toHaveCount(0)
  })

  test("edits a role name through the dialog", async ({ page }) => {
    await page.goto("/roles")

    await page.getByRole("button", { name: "Edit" }).first().click()
    await expect(page.getByText("Edit Role")).toBeVisible()
    await page.getByLabel("Role Name").fill("Consultant")
    await page.getByRole("button", { name: "Save Changes" }).click()

    await expect(page.getByRole("heading", { name: "Consultant" })).toBeVisible()
  })
})

test.describe("sharpen the saw management", () => {
  test("adds an activity and confirms before deleting it", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/sharpen-the-saw")

    await page.getByPlaceholder("Add a physical activity...").fill("Swim 1km")
    await page.getByRole("button", { name: "Add Physical activity" }).click()
    await expect(page.getByText("Swim 1km")).toBeVisible()

    const row = page.locator("div.group").filter({ hasText: "Swim 1km" }).first()
    await row.hover()
    await row.getByRole("button", { name: "Delete activity" }).click()

    await expect(page.getByText("Delete Activity?")).toBeVisible()
    await page.getByRole("button", { name: "Delete Activity", exact: true }).click()
    await expect(page.getByText("Swim 1km")).toHaveCount(0)
  })
})

test.describe("settings", () => {
  test("shows the Save bar only after a change, and Discard clears it", async ({ page }) => {
    await page.goto("/settings")

    await page.getByRole("button", { name: "Connect Google Calendar" }).click()
    await expect(page.getByText("Google Calendar connected")).toBeVisible()
    await expect(page.getByText("You have unsaved changes.")).toHaveCount(0)

    await page.getByRole("checkbox", { name: "Fixed Appointments" }).click()
    await expect(page.getByText("You have unsaved changes.")).toBeVisible()

    await page.getByRole("button", { name: "Discard" }).click()
    await expect(page.getByText("You have unsaved changes.")).toHaveCount(0)
  })

  test("marks a parent category indeterminate when one child is off", async ({ page }) => {
    await page.goto("/settings")
    await page.getByRole("button", { name: "Connect Google Calendar" }).click()

    const parent = page.getByRole("checkbox", { name: "Sharpen the Saw Activities" })
    await expect(parent).toHaveAttribute("aria-checked", "true")

    await page.getByRole("button", { name: /^Physical$/ }).click()
    await expect(parent).toHaveAttribute("aria-checked", "mixed")

    // Toggling the parent switches every child back on.
    await parent.click()
    await expect(parent).toHaveAttribute("aria-checked", "true")
  })

  test("saves the end-of-day time to localStorage", async ({ page }) => {
    await page.goto("/settings")

    await page.getByLabel("Show check-in at").fill("20:15")
    await page.getByRole("button", { name: "Save", exact: true }).click()

    await expect(page.getByText("End-of-day time saved")).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem("eod_time"))).toBe("20:15")
  })
})

test.describe("evening reflections", () => {
  test("writes a reflection and then unlocks the summary", async ({ page }) => {
    await page.goto("/evening-reflections")

    await expect(page.getByRole("button", { name: /Generate Summary/ })).toBeDisabled()

    await page.getByRole("button", { name: "Create" }).first().click()
    await page.getByPlaceholder("Today I reflected on…").fill("A good day of deep work.")
    await page.getByRole("button", { name: "Save Reflection" }).click()

    await expect(page.getByText("A good day of deep work.")).toBeVisible()
    await expect(page.getByRole("button", { name: /Generate Summary/ })).toBeEnabled()
  })

  test("switches between weeks", async ({ page }) => {
    await page.goto("/evening-reflections")

    const secondWeek = page.locator("aside button").nth(1)
    const label = (await secondWeek.textContent())!.trim()
    await secondWeek.click()

    await expect(page.locator("main").getByText(label)).toBeVisible()
  })
})

test.describe("history and analytics", () => {
  test("history switches between past weeks", async ({ page }) => {
    await page.goto("/history")

    await expect(page.getByRole("heading", { name: /Week of/ })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Role Goals" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Weekly Schedule" })).toBeVisible()

    const secondWeek = page.locator("aside li button").nth(1)
    const label = (await secondWeek.textContent())!.trim()
    await secondWeek.click()

    await expect(page.getByRole("heading", { name: `Week of ${label}` })).toBeVisible()
  })

  test("analytics renders all four cards", async ({ page }) => {
    await page.goto("/analytics")

    await expect(page.getByRole("heading", { name: /Your Analytics/ })).toBeVisible()
    // Each card exposes its own date selector.
    await expect(page.locator("select").first()).toBeVisible()
    await expect(page.getByText("Programmer")).toBeVisible()
  })
})

test.describe("dashboard", () => {
  test("shows the weekly timetable and its legend", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/dashboard")

    await expect(page.getByRole("heading", { name: /Schedule for this Week/ })).toBeVisible()
    await expect(page.getByText("Fixed appointment", { exact: true })).toBeVisible()
    await expect(page.getByText("Daily priority")).toBeVisible()
    await expect(page.getByText("Team Standup").first()).toBeVisible()
  })
})
