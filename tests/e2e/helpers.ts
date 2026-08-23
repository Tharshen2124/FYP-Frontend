import { expect, type Page } from "@playwright/test"

/**
 * Sets the signed-in user's End-of-Day check-in time, as "HH:MM".
 *
 * This lives on the user row now rather than in `localStorage`, so it is also the only way to
 * decide whether the check-in modal opens during a test. `authenticateAsNewUser` pushes it to
 * 23:59 for exactly that reason — the dialog's overlay swallows pointer events, so a suite that
 * happens to run in the evening would fail every test that clicks anything on the dashboard.
 */
export async function setEodTime(page: Page, time: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

  await page.evaluate(async ({ apiUrl, time }: { apiUrl: string; time: string }) => {
    const cookie = document.cookie.match(/(?:^|; )habitflow-auth=([^;]*)/)
    const token = JSON.parse(decodeURIComponent(cookie![1])).state.token

    const res = await fetch(`${apiUrl}/users/eod-time`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eod_time: time }),
    })
    if (!res.ok) throw new Error(`PATCH /users/eod-time \u2192 ${res.status} ${await res.text()}`)
  }, { apiUrl, time })
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

  // Out of the way of every test that is not about it. tests/e2e/end-of-day.spec.ts moves it back.
  await setEodTime(page, "23:59")

  return { email, username, password }
}

/** Adds one activity to each of the four Sharpen the Saw dimensions on the onboarding STS step. */
export async function fillEveryDimension(page: Page) {
  const dimensions = ["Physical", "Spiritual", "Mental", "Social / Emotional"]
  for (const label of dimensions) {
    await page.getByPlaceholder(`Add a ${label.toLowerCase()} activity...`).fill(`${label} activity`)
    await page.getByRole("button", { name: `Add ${label} activity` }).click()
    await expect(page.getByText(`${label} activity`)).toBeVisible()
  }
}

/**
 * A day column of the *current* week that still accepts new items, 0 = Monday … 6 = Sunday.
 *
 * The calendars block every day that has already passed, so a hard-coded column would make these
 * specs pass on a Monday and fail on a Friday. `offset` asks for a later day where a spec wants
 * two distinct ones, clamped to Sunday — the calendar has nowhere further to go.
 */
export function schedulableColumn(offset = 0): number {
  const todayIndex = (new Date().getDay() + 6) % 7
  return Math.min(6, todayIndex + offset)
}

/**
 * Clicks a calendar column at roughly the given hour offset to open its add modal.
 *
 * `position` rather than `page.mouse` at a computed viewport point: the column is 1024px tall
 * inside a 560px scroll box, so the slot wanted is often out of view, and only a locator click
 * scrolls it in first. The offset is measured the same way the page measures it — from the top of
 * the column, which is what its own handler subtracts from `clientY`.
 */
export async function clickSlot(page: Page, dayIndex: number, hoursFromStart: number) {
  const column = page.locator(`[data-day-column="${dayIndex}"]`)
  const box = (await column.boundingBox())!
  await column.click({ position: { x: box.width / 2, y: hoursFromStart * 64 + 10 } })
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
 * priority that was not, and Sharpen the Saw tasks spread unevenly over three of the four dimensions.
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
    // halves of a ratio and the balance card can tell a completed Sharpen the Saw task from a planned one.
    const undone = ["Outline the retrospective", "Meditate"]
    for (const task of tasks.filter((t: { title: string }) => !undone.includes(t.title))) {
      await call("PATCH", `/tasks/${task.task_id}/completion`, { is_completed: true })
    }

    await call("PATCH", `/goals/${achieved.goal_id}?week_start=${weekStart}`, { is_completed: true })
  }, apiUrl)
}

/**
 * Signs an existing user in on a fresh page. Paired with a second browser context, this is how a
 * test stands in for the user's other device: a different browser, no shared storage, same account.
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Email Address").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.locator("form").getByRole("button", { name: "Sign In", exact: true }).click()
  await page.waitForURL(/\/(dashboard|onboarding\/roles)$/)
}

/** Arms the check-in so it is due the moment the dashboard loads, whenever the suite runs. */
export async function seedEodTimeNow(page: Page) {
  await setEodTime(page, "00:01")
}

/**
 * Puts one goal-linked task on *today*, in the week `seedWeeklyPlan` has just created.
 *
 * The End-of-Day check-in lists today and nothing else, and `completeOnboarding` schedules its
 * task on a Wednesday — so on six days out of seven a test that needs a tickable task has to place
 * one against the clock. `POST /weekly-plans/tasks` reconciles the whole week, so this is called
 * on a plan that has no scheduled tasks yet rather than added to one that has.
 */
export async function seedTaskToday(page: Page, title: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

  await page.evaluate(async ({ apiUrl, title }: { apiUrl: string; title: string }) => {
    const cookie = document.cookie.match(/(?:^|; )habitflow-auth=([^;]*)/)
    const token = JSON.parse(decodeURIComponent(cookie![1])).state.token

    // The local Monday and today's column, derived exactly as lib/date.ts does.
    const monday = new Date()
    monday.setDate(monday.getDate() + (monday.getDay() === 0 ? -6 : 1 - monday.getDay()))
    const weekStart = [
      monday.getFullYear(),
      String(monday.getMonth() + 1).padStart(2, "0"),
      String(monday.getDate()).padStart(2, "0"),
    ].join("-")
    const todayIndex = (new Date().getDay() + 6) % 7

    const call = async (method: string, path: string, body?: unknown) => {
      const res = await fetch(`${apiUrl}${path}`, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`${method} ${path} \u2192 ${res.status} ${await res.text()}`)
      return res.json()
    }

    const { roles } = await call("GET", `/roles?week_start=${weekStart}`)
    const { goal } = await call("POST", `/goals?week_start=${weekStart}`, {
      role_id: roles[0].role_id,
      description: "Finish what today asked for",
    })

    await call("POST", `/weekly-plans/tasks?week_start=${weekStart}`, {
      tasks: [
        {
          title,
          day_of_week: todayIndex,
          start_time: "09:00",
          end_time: "10:00",
          goal_id: goal.goal_id,
        },
      ],
    })
  }, { apiUrl, title })
}

/**
 * Walks the whole onboarding flow against the live backend and lands on /dashboard, leaving the
 * user with a real weekly plan: three goals, four Sharpen the Saw activities, one fixed appointment
 * ("Team standup", Monday) and one goal-linked task ("Deep work", Wednesday).
 *
 * Used by tests that need a dashboard with something on it.
 */
export async function completeOnboarding(page: Page) {
  await seedWeeklyPlan(page)

  await fillEveryDimension(page)
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.waitForURL(/\/onboarding\/fixed-appointments$/)

  await clickSlot(page, schedulableColumn(), 3)
  await page.getByRole("textbox", { name: "Appointment" }).fill("Team standup")
  await page.getByRole("button", { name: "Add Appointment" }).click()
  await expect(page.getByText("Team standup")).toBeVisible()
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.waitForURL(/\/onboarding\/schedule-tasks$/)

  await clickSlot(page, schedulableColumn(), 5)
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
