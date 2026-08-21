import { test, expect } from "@playwright/test"
import { suppressEndOfDayModal, authenticateAsNewUser, completeOnboarding, seedWeeklyPlan } from "./helpers"

test.beforeEach(async ({ page }) => {
  await suppressEndOfDayModal(page)
})

test.describe("roles management", () => {
  // /roles reads and writes the live backend now, so every test needs a session and a week that
  // already has roles and goals in it.
  test.beforeEach(async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto("/roles")
  })

  test("confirms before archiving a role, stating what it affects this week", async ({ page }) => {
    await page.getByRole("button", { name: "Delete Professional" }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog.getByText("Archive Role?")).toBeVisible()
    await expect(dialog.getByText("2 goals")).toBeVisible()
    await expect(dialog.getByText("You can restore this role at any time.")).toBeVisible()

    await page.getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByRole("heading", { name: "Professional" })).toBeVisible()
  })

  test("archives a role into the archived list and restores it", async ({ page }) => {
    await page.getByRole("button", { name: "Delete Professional" }).click()
    await page.getByRole("button", { name: "Archive Role", exact: true }).click()

    await expect(page.getByRole("heading", { name: "Professional" })).toHaveCount(0)
    await expect(page.getByRole("heading", { name: "Archived" })).toBeVisible()

    await page.getByRole("button", { name: "Restore Professional" }).click()
    await expect(page.getByRole("heading", { name: "Professional" })).toBeVisible()
  })

  // Removing a goal is always reversible, which is why there is no hard delete anywhere.
  test("removes a goal and puts it back with Undo", async ({ page }) => {
    const goal = "Mentor junior team member"
    const row = page.locator("div.group").filter({ hasText: goal }).first()
    await row.hover()
    await row.getByTitle("Delete goal").click()

    await expect(page.getByRole("alertdialog").getByText("Remove Goal?")).toBeVisible()
    await page.getByRole("button", { name: "Remove Goal", exact: true }).click()
    await expect(page.getByText(goal)).toHaveCount(0)

    await page.getByRole("button", { name: "Undo" }).click()
    await expect(page.getByText(goal)).toBeVisible()
  })

  test("adds a role and a goal, and they survive a reload", async ({ page }) => {
    await page.getByRole("button", { name: "Add New Role" }).click()
    await page.getByLabel("Role Name").fill("Athlete")
    await page.getByRole("button", { name: "Add Role" }).click()
    await expect(page.getByRole("heading", { name: "Athlete" })).toBeVisible()

    await page.getByPlaceholder("Add a goal for this role...").last().fill("Run a 10k")
    await page.getByRole("button", { name: "Add goal to Athlete" }).click()
    await expect(page.getByText("Run a 10k")).toBeVisible()

    await page.reload()
    await expect(page.getByRole("heading", { name: "Athlete" })).toBeVisible()
    await expect(page.getByText("Run a 10k")).toBeVisible()
  })

  test("edits a role name through the dialog", async ({ page }) => {
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


test.describe("history and analytics", () => {
  // /history reads the live backend now, so it needs a session. A fresh user has no past weeks at
  // all, which is itself the case worth pinning: the strip still lists them, and each one says so.
  test.describe("history", () => {
    test.beforeEach(async ({ page }) => {
      await authenticateAsNewUser(page)
      await page.goto("/history")
    })

    test("opens on the most recent past week, stamped into the URL", async ({ page }) => {
      await expect(page.getByRole("heading", { name: /Week of/ })).toBeVisible()
      // The week lives in the URL so a reload, a Back and a shared link all land on the same one.
      await expect(page).toHaveURL(/\/history\?week_start=\d{4}-\d{2}-\d{2}/)

      const opened = new URL(page.url()).searchParams.get("week_start")!
      await page.reload()
      await expect(page).toHaveURL(new RegExp(`week_start=${opened}`))
    })

    test("says so for a week that was never planned, rather than showing an empty grid", async ({ page }) => {
      await expect(page.getByText(/didn't plan this week/)).toBeVisible()
    })

    test("switches between past weeks", async ({ page }) => {
      const secondWeek = page.locator("aside li button").nth(1)
      const label = (await secondWeek.locator("span").first().textContent())!.trim()
      await secondWeek.click()

      await expect(page.getByRole("heading", { name: `Week of ${label}` })).toBeVisible()
    })

    test("never offers the current week, which has not finished happening", async ({ page }) => {
      const thisMonday = await page.evaluate(() => {
        const d = new Date()
        d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()))
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      })

      await expect(page.locator("#jump-to-week")).toHaveAttribute("max", /\d{4}-\d{2}-\d{2}/)
      expect(await page.locator("#jump-to-week").getAttribute("max")).not.toBe(thisMonday)

      // A hand-edited URL naming the live week is clamped rather than refused.
      await page.goto(`/history?week_start=${thisMonday}`)
      await expect(page).not.toHaveURL(new RegExp(`week_start=${thisMonday}`))
    })

    test("load older weeks widens the strip", async ({ page }) => {
      const rows = page.locator("aside li button")
      await expect(rows).toHaveCount(8)

      await page.getByRole("button", { name: "Load older weeks" }).click()
      await expect(rows).toHaveCount(16)
    })
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
  test("asks an unplanned week to be planned, instead of an empty calendar", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/dashboard")

    await expect(page.getByRole("heading", { name: /Schedule for this Week/ })).toBeVisible()
    await expect(page.getByRole("heading", { name: /This week isn't planned yet/ })).toBeVisible()
    await expect(page.getByRole("link", { name: /Create Weekly Plan/ })).toBeVisible()

    // Nothing to edit or read a legend for while there is no plan.
    await expect(page.getByRole("button", { name: /Edit Weekly Plan/ })).toHaveCount(0)
    await expect(page.getByText("Daily Priority", { exact: true })).toHaveCount(0)
  })

  test("the create button leads into the weekly plan flow", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/dashboard")

    await page.getByRole("link", { name: /Create Weekly Plan/ }).click()
    await expect(page).toHaveURL(/\/weekly-plan\/goals/)
  })

  test("shows the week the user actually planned during onboarding", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)

    await expect(page.getByRole("heading", { name: /Schedule for this Week/ })).toBeVisible()
    await expect(page.getByText("Fixed Appointments", { exact: true })).toBeVisible()
    await expect(page.getByText("Your Tasks", { exact: true })).toBeVisible()
    await expect(page.getByText("Daily Priority", { exact: true })).toBeVisible()

    // Both of the items created in onboarding, read back from the backend.
    await expect(page.getByText("Team standup").first()).toBeVisible()
    await expect(page.getByText("Deep work").first()).toBeVisible()

    await expect(page.getByRole("heading", { name: /This week isn't planned yet/ })).toHaveCount(0)
  })
})
