import { test, expect, type Page } from "@playwright/test"
import {
  authenticateAsNewUser,
  clickSlot,
  schedulableColumn,
  completeOnboarding,
  fillEveryDimension,
  seedNextWeekPlan,
  seedWeeklyPlan,
} from "./helpers"

// The only spec that was missing this. Without it, a run after the 21:00 check-in time opens
// the End-of-Day modal on /dashboard, and a task title then matches twice -- once on the
// timetable and once in the modal's checklist. Every other spec file already does this.

const nextButton = (page: Page) => page.getByRole("button", { name: "Next", exact: true })

/** The Monday of the local current week, the way lib/date.ts derives it. */
function currentMonday(): string {
  const d = new Date()
  d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function mondayAfter(weekStart: string): string {
  const d = new Date(`${weekStart}T00:00:00`)
  d.setDate(d.getDate() + 7)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

test.describe("weekly plan target week", () => {
  // The whole reason the flow takes a week: someone coming back to a week they never planned has
  // to be able to fill in the one they are standing in, not be pushed forward past it.
  test("offers the current week when it has no plan", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/weekly-plan/goals")

    await expect(page).toHaveURL(new RegExp(`week_start=${currentMonday()}`))
    await expect(page.getByText("You haven't planned this week yet.")).toBeVisible()
  })

  test("offers next week once the current one is planned", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto("/weekly-plan/goals")

    await expect(page).toHaveURL(new RegExp(`week_start=${mondayAfter(currentMonday())}`))
    await expect(page.getByText("This week is already planned")).toBeVisible()
  })

  // The week is decided by the rule and reported, never asked. Re-planning a week that is already
  // planned belongs to /weekly-plan/edit, /roles and /sharpen-the-saw, so a control here would only
  // be a second, worse route to those.
  test("offers no control to change the week it picked", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto("/weekly-plan/goals")
    await expect(page).toHaveURL(new RegExp(`week_start=${mondayAfter(currentMonday())}`))

    await expect(page.getByRole("button", { name: /Plan this week instead/ })).toHaveCount(0)
    await expect(page.getByRole("button", { name: /Plan next week instead/ })).toHaveCount(0)
  })

  // The flow stops one week ahead. Planning further out is planning a week whose shape is not known
  // yet, and the week after next becomes reachable on its own once next week starts.
  test("refuses a third week when this week and the next are both planned", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await seedNextWeekPlan(page)
    await page.goto("/weekly-plan/goals")

    await expect(page.getByText(/planned through next week/)).toBeVisible()
    await expect(nextButton(page)).toBeDisabled()

    // No week is stamped into the URL, so a reload re-runs the check rather than walking back into
    // the wizard on a week that needs no planning.
    await expect(page).toHaveURL(/\/weekly-plan\/goals$/)
    await page.reload()
    await expect(page.getByText(/planned through next week/)).toBeVisible()
  })

  test("points at the surfaces that do change a planned week", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await seedNextWeekPlan(page)
    await page.goto("/weekly-plan/goals")

    await page.getByRole("link", { name: /Edit Weekly Plan/ }).click()
    await page.waitForURL(/\/weekly-plan\/edit$/)
  })

  test("the week it picked survives a reload", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto("/weekly-plan/goals")

    const nextWeek = mondayAfter(currentMonday())
    await expect(page).toHaveURL(new RegExp(`week_start=${nextWeek}`))

    await page.reload()
    await expect(page).toHaveURL(new RegExp(`week_start=${nextWeek}`))
  })

  test("carries the chosen week through every step", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)

    const nextWeek = mondayAfter(currentMonday())
    await page.goto(`/weekly-plan/goals?week_start=${nextWeek}`)

    // A new week starts with no goals at all, so Next stays shut until one is planned for it —
    // here by carrying forward the goal onboarding set for the current week.
    await expect(nextButton(page)).toBeDisabled()
    await page.getByRole("button", { name: /Complete quarterly project milestone/ }).click()

    await nextButton(page).click()
    await page.waitForURL(new RegExp(`/weekly-plan/sharpen-the-saw\\?week_start=${nextWeek}`))

    await page.getByRole("button", { name: /Physical activity/ }).click()
    await nextButton(page).click()
    await page.waitForURL(new RegExp(`/weekly-plan/schedule\\?week_start=${nextWeek}`))
  })
})

test.describe("planning the upcoming week", () => {
  // The whole point of the flow, end to end: pick next week, walk all three steps, and everything
  // is filed under next week while the week the user is living in is left exactly as it was.
  test("files the whole plan under next week and leaves this week untouched", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)

    const nextWeek = mondayAfter(currentMonday())

    // Entered with no week in the URL: this week is planned, so the flow offers the next one.
    await page.goto("/weekly-plan/goals")
    await expect(page).toHaveURL(new RegExp(`week_start=${nextWeek}`))
    await expect(page.getByText("This week is already planned")).toBeVisible()

    await page.getByRole("button", { name: /Complete quarterly project milestone/ }).click()
    await nextButton(page).click()
    await page.waitForURL(new RegExp(`/weekly-plan/sharpen-the-saw\\?week_start=${nextWeek}`))

    await page.getByRole("button", { name: /Physical activity/ }).click()
    await nextButton(page).click()
    await page.waitForURL(new RegExp(`/weekly-plan/schedule\\?week_start=${nextWeek}`))

    // A brand-new week starts empty — onboarding's appointment and task belong to this week.
    await expect(page.getByText("Team standup")).toHaveCount(0)

    await page.getByRole("tab", { name: "Scheduled Tasks" }).click()
    await clickSlot(page, 3, 6)
    const modal = page.getByRole("dialog")
    await modal.getByPlaceholder(/Work on project report/).fill("Next week's deep work")
    await modal.getByRole("button", { name: "Professional", exact: true }).click()
    await modal.getByRole("button", { name: "Complete quarterly project milestone" }).click()
    await modal.getByRole("button", { name: "Add Task", exact: true }).click()

    await nextButton(page).click()
    await page.waitForURL(/\/dashboard$/)

    // The dashboard only ever shows the current week, so it still shows onboarding's task and
    // knows nothing about the one just scheduled for next week.
    await expect(page.getByText("Deep work", { exact: true })).toBeVisible()
    await expect(page.getByText("Next week's deep work")).toHaveCount(0)

    // Next week, however, now has a plan of its own holding exactly what was just entered.
    await page.goto(`/weekly-plan/schedule?week_start=${nextWeek}`)
    await page.getByRole("tab", { name: "Scheduled Tasks" }).click()
    await expect(page.getByText("Next week's deep work")).toBeVisible()
    await expect(page.getByText("Deep work", { exact: true })).toHaveCount(0)
  })
})

test.describe("weekly plan goals step", () => {
  test("points a user with no roles at the roles page", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/weekly-plan/goals")

    await expect(page.getByText("You have no active roles yet.")).toBeVisible()
    await expect(nextButton(page)).toBeDisabled()
  })

  test("lists this week's roles with the goals already added", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto(`/weekly-plan/goals?week_start=${currentMonday()}`)

    for (const role of ["Professional", "Parent"]) {
      await expect(page.getByRole("heading", { name: role })).toBeVisible()
    }
    // Onboarding planned the current week, so its goals show as committed rather than as
    // carry-forward candidates — those come from the last week that was planned.
    await expect(page.getByText("Complete quarterly project milestone")).toBeVisible()
    await expect(page.getByText("Added").first()).toBeVisible()
  })

  test("stages a new goal and saves it on Next", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto(`/weekly-plan/goals?week_start=${currentMonday()}`)

    await page.getByPlaceholder("Add a new goal for this week...").first().fill("Draft the report")
    await page.getByRole("button", { name: "Add goal to Professional" }).click()
    await expect(page.getByText("Draft the report")).toBeVisible()

    await nextButton(page).click()
    await page.waitForURL(/\/weekly-plan\/sharpen-the-saw/)

    await page.goto("/roles")
    await expect(page.getByText("Draft the report")).toBeVisible()
  })

  // Onboarding planned the current week, so planning next week offers its goals to carry over.
  test("offers the previous week's goals to carry forward", async ({ page }) => {
    await authenticateAsNewUser(page)
    await seedWeeklyPlan(page)
    await page.goto(`/weekly-plan/goals?week_start=${mondayAfter(currentMonday())}`)

    await expect(page.getByText("Carry forward").first()).toBeVisible()
    await page.getByRole("button", { name: /Complete quarterly project milestone/ }).click()

    await nextButton(page).click()
    await page.waitForURL(/\/weekly-plan\/sharpen-the-saw/)
  })
})

test.describe("weekly plan Sharpen the Saw step", () => {
  test.beforeEach(async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/onboarding/sharpen-the-saw")
    await fillEveryDimension(page)
    await nextButton(page).click()
    await page.waitForURL(/\/onboarding\/fixed-appointments$/)
  })

  test("gates Next until an activity is selected", async ({ page }) => {
    await page.goto("/weekly-plan/sharpen-the-saw")

    await expect(nextButton(page)).toBeDisabled()
    await expect(page.getByText("Select at least one activity")).toBeVisible()

    await page.getByRole("button", { name: /Physical activity/ }).click()
    await expect(nextButton(page)).toBeEnabled()
  })

  test("shows all four dimensions with their activities", async ({ page }) => {
    await page.goto("/weekly-plan/sharpen-the-saw")

    for (const dim of ["Physical", "Spiritual", "Mental", "Social / Emotional"]) {
      await expect(page.getByRole("heading", { name: dim })).toBeVisible()
    }
    await expect(page.getByRole("button", { name: /Physical activity/ })).toBeVisible()
  })

  // The step used to throw the selection away on Next, so coming back showed a blank slate.
  test("remembers the week's committed activities on a return visit", async ({ page }) => {
    await page.goto("/weekly-plan/sharpen-the-saw")
    await page.getByRole("button", { name: /Physical activity/ }).click()
    await nextButton(page).click()
    await page.waitForURL(/\/weekly-plan\/schedule/)

    await page.goBack()
    await expect(nextButton(page)).toBeEnabled()
    await expect(page.getByRole("button", { name: /Physical activity/ })).toHaveAttribute("aria-pressed", "true")
  })
})

test.describe("weekly plan schedule step", () => {
  test("offers both tabs and gates Next on a task", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)
    await page.goto(`/weekly-plan/schedule?week_start=${mondayAfter(currentMonday())}`)

    await expect(page.getByRole("tab", { name: "Fixed Appointments" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Scheduled Tasks" })).toBeVisible()
    // The new week starts empty, so there is nothing to finish planning with yet.
    await expect(nextButton(page)).toBeDisabled()

    await page.getByRole("tab", { name: "Scheduled Tasks" }).click()
    await expect(page.getByRole("tab", { name: "Scheduled Tasks" })).toHaveAttribute("data-state", "active")
  })

  // The calendar took its dates from `useCurrentWeek()`, so planning the week ahead drew this
  // week's numbers and dimmed days that had not happened yet.
  test("heads the calendar with the dates of the week being planned", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)

    const nextWeek = mondayAfter(currentMonday())
    await page.goto(`/weekly-plan/schedule?week_start=${nextWeek}`)

    const monday = new Date(`${nextWeek}T00:00:00`)
    await expect(page.getByText(`Mon ${monday.getDate()}`, { exact: true })).toBeVisible()

    // Nothing in a future week has been and gone, so no column is marked as today.
    const todayChip = page.locator(".bg-primary.text-primary-foreground")
      .filter({ hasText: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d+$/ })
    await expect(todayChip).toHaveCount(0)

    // The current week does mark one — which is what proves the count above is a real zero and
    // not a selector that never matches anything.
    await page.goto(`/weekly-plan/schedule?week_start=${currentMonday()}`)
    const thisMonday = new Date(`${currentMonday()}T00:00:00`)
    await expect(page.getByText(`Mon ${thisMonday.getDate()}`, { exact: true })).toBeVisible()
    await expect(todayChip).toHaveCount(1)
  })

  test("loads the week's existing appointments and tasks", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)
    await page.goto(`/weekly-plan/schedule?week_start=${currentMonday()}`)

    await expect(page.getByText("Team standup")).toBeVisible()
    await page.getByRole("tab", { name: "Scheduled Tasks" }).click()
    await expect(page.getByText("Deep work")).toBeVisible()
    await expect(nextButton(page)).toBeEnabled()
  })

  // Saving used to delete and rebuild every task, which handed each one a new id. Re-saving an
  // unchanged week is the cheapest way to see that it now updates in place instead.
  test("re-saving a week does not duplicate what is already in it", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)
    await page.goto(`/weekly-plan/schedule?week_start=${currentMonday()}`)

    await expect(page.getByText("Team standup")).toBeVisible()
    await nextButton(page).click()
    await page.waitForURL(/\/dashboard$/)

    await page.goto(`/weekly-plan/schedule?week_start=${currentMonday()}`)
    await expect(page.getByText("Team standup")).toHaveCount(1)
    await page.getByRole("tab", { name: "Scheduled Tasks" }).click()
    await expect(page.getByText("Deep work")).toHaveCount(1)
  })

  test("adds a task against this week's goals and persists it", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)
    await page.goto(`/weekly-plan/schedule?week_start=${currentMonday()}`)

    await page.getByRole("tab", { name: "Scheduled Tasks" }).click()
    await clickSlot(page, schedulableColumn(), 8)

    const modal = page.getByRole("dialog")
    await modal.getByPlaceholder(/Work on project report/).fill("Write the summary")
    await modal.getByRole("button", { name: "Professional", exact: true }).click()
    await modal.getByRole("button", { name: "Complete quarterly project milestone" }).click()
    await modal.getByRole("button", { name: "Add Task", exact: true }).click()
    await expect(page.getByText("Write the summary")).toBeVisible()

    await nextButton(page).click()
    await page.waitForURL(/\/dashboard$/)
    await expect(page.getByText("Write the summary")).toBeVisible()
  })
})
