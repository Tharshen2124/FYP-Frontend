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
 * Gives the user a *finished* week with something in it: a goal that was achieved, a starred
 * priority that was not, and renewal tasks spread unevenly over three of the four dimensions.
 *
 * /analytics only reads weeks that have ended, so nothing the UI can plan is visible to it — the
 * planning flow only ever offers the current week or the next one. This drives the API directly for
 * last week instead, which is the same set of requests the flow itself makes, in the same order.
 */
export async function seedPastWeek(page: Page) {
  // Standing roles and this week's goals first: a goal needs a role, and roles are long-lived.
  await seedWeeklyPlan(page)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

  await page.evaluate(async (apiUrl: string) => {
    const cookie = document.cookie.match(/(?:^|; )habitflow-auth=([^;]*)/)
    const token = JSON.parse(decodeURIComponent(cookie![1])).state.token

    // The Monday of last week, derived from the local clock exactly as lib/date.ts does — every
    // week_start in this app is the user's local date, never the server's.
    const monday = new Date()
    monday.setDate(monday.getDate() + (monday.getDay() === 0 ? -6 : 1 - monday.getDay()) - 7)
    const weekStart = [
      monday.getFullYear(),
      String(monday.getMonth() + 1).padStart(2, "0"),
      String(monday.getDate()).padStart(2, "0"),
    ].join("-")

    const call = async (method: string, path: string, body?: unknown) => {
      const res = await fetch(`${apiUrl}${path}`, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`)
      return res.json()
    }

    const { roles } = await call("GET", `/roles?week_start=${weekStart}`)
    const roleId = roles[0].role_id

    // Two goals, so the completion card has a ratio rather than 1/1.
    const { goal: achieved } = await call("POST", `/goals?week_start=${weekStart}`, {
      role_id: roleId,
      description: "Ship the past week",
      is_weekly_priority: true,
    })
    const { goal: missed } = await call("POST", `/goals?week_start=${weekStart}`, {
      role_id: roleId,
      description: "Write the retrospective",
    })

    // Three dimensions, unevenly renewed, so the balance card has a real split to draw rather than
    // one dimension holding everything: two physical tasks done, one mental done, one spiritual not.
    const activityIds: Record<string, number> = {}
    for (const [dimension, description] of [
      ["physical", "Swim"],
      ["mental", "Read a chapter"],
      ["spiritual", "Meditate"],
    ]) {
      const { activity } = await call("POST", "/sharpen-the-saw-activities", {
        dimension,
        activity_description: description,
      })
      activityIds[dimension] = activity.sharpen_the_saw_activity_id
    }

    const { tasks } = await call("POST", `/weekly-plans/tasks?week_start=${weekStart}`, {
      tasks: [
        {
          title: "Draft the final chapter",
          day_of_week: 1,
          start_time: "14:00",
          end_time: "15:30",
          goal_id: achieved.goal_id,
        },
        {
          title: "Outline the retrospective",
          day_of_week: 3,
          start_time: "10:00",
          end_time: "11:00",
          goal_id: missed.goal_id,
          is_daily_priority: true,
        },
        {
          title: "Swim",
          day_of_week: 1,
          start_time: "07:00",
          end_time: "08:00",
          sharpen_the_saw_activity_id: activityIds.physical,
        },
        {
          title: "Swim again",
          day_of_week: 3,
          start_time: "07:00",
          end_time: "08:00",
          sharpen_the_saw_activity_id: activityIds.physical,
        },
        {
          title: "Read a chapter",
          day_of_week: 1,
          start_time: "09:00",
          end_time: "10:00",
          sharpen_the_saw_activity_id: activityIds.mental,
        },
        {
          title: "Meditate",
          day_of_week: 2,
          start_time: "07:00",
          end_time: "07:30",
          sharpen_the_saw_activity_id: activityIds.spiritual,
        },
      ],
    })

    // Tick off everything but the starred priority and the spiritual task, so each card has both
    // halves of a ratio and the balance card can tell a completed renewal task from a planned one.
    const undone = ["Outline the retrospective", "Meditate"]
    for (const task of tasks.filter((t: { title: string }) => !undone.includes(t.title))) {
      await call("PATCH", `/tasks/${task.task_id}/completion`, { is_completed: true })
    }

    await call("PATCH", `/goals/${achieved.goal_id}?week_start=${weekStart}`, { is_completed: true })
  }, apiUrl)
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
