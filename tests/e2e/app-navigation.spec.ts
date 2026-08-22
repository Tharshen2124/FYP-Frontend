import { test, expect } from "@playwright/test"
import { suppressEndOfDayModal, authenticateAsNewUser, seedWeeklyPlan } from "./helpers"

test.beforeEach(async ({ page }) => {
  await suppressEndOfDayModal(page)
})

const SIDEBAR_ROUTES: [string, string][] = [
  ["Dashboard", "/dashboard"],
  ["Roles and Goals", "/roles"],
  ["Sharpen the Saw", "/sharpen-the-saw"],
  ["Schedule Upcoming Weekly Plan", "/weekly-plan/goals"],
  ["Settings", "/settings"],
  ["Evening Reflections", "/evening-reflections"],
  ["History", "/history"],
  ["Analytics", "/analytics"],
]

test.describe("app navigation", () => {
  test("every sidebar link reaches its route", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/dashboard")

    for (const [label, href] of SIDEBAR_ROUTES) {
      await page.getByRole("link", { name: label, exact: true }).click()
      // The weekly-plan flow stamps its target week into the URL as it resolves, so the query is
      // part of a correct landing rather than a stray.
      await expect(page).toHaveURL(new RegExp(`${href}(\\?|$)`))
      await page.goto("/dashboard")
    }
  })

  test("the sidebar highlights the active route", async ({ page }) => {
    // /analytics is gated like every other dashboard route now, so an unauthenticated visit is a
    // redirect to /login and there is no sidebar to highlight.
    await authenticateAsNewUser(page)
    await page.goto("/analytics")
    const active = page.getByRole("link", { name: "Analytics", exact: true })
    await expect(active).toHaveClass(/text-primary/)
  })

  test("landing CTAs lead to login, and signing up then in leads into onboarding", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /Start Planning Free/ }).click()
    await expect(page).toHaveURL(/\/login$/)

    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const email = `e2e-${unique}@example.com`
    const password = "password123"

    await page.getByRole("button", { name: "Sign Up", exact: true }).click()
    await page.getByLabel("Email Address").fill(email)
    await page.getByLabel("Username").fill(`e2e_${unique}`)
    await page.getByLabel("Password", { exact: true }).fill(password)
    await page.locator("form").getByRole("button", { name: "Create Account" }).click()

    // Signing up switches back to the Sign In tab rather than logging in automatically.
    await page.locator("form").getByRole("button", { name: "Sign In", exact: true }).waitFor()
    await page.getByLabel("Email Address").fill(email)
    await page.getByLabel("Password", { exact: true }).fill(password)
    await page.locator("form").getByRole("button", { name: "Sign In", exact: true }).click()

    await expect(page).toHaveURL(/\/onboarding\/roles$/)
  })

  // Editing a week in place needs its own page — one that loads the current week and saves edits
  // directly. Until it exists the button has no destination: pointing it at the planning flow's
  // last step would mean "finish planning", not "save my change".
  test("dashboard shows Edit Weekly Plan as not yet available", async ({ page }) => {
    await authenticateAsNewUser(page)
    // The button only renders once a plan exists for the current week.
    await seedWeeklyPlan(page)
    await page.goto("/dashboard")

    await expect(page.getByRole("link", { name: /Edit Weekly Plan/ })).toHaveCount(0)
    await expect(page.getByRole("button", { name: /Edit Weekly Plan/ })).toBeDisabled()
  })

  test("sign out returns to the login page", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/dashboard")
    await page.getByRole("button", { name: /Sign Out/ }).click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test("every route renders without a client-side error", async ({ page }) => {
    await authenticateAsNewUser(page)

    const errors: string[] = []
    page.on("pageerror", e => errors.push(e.message))

    const routes = [
      "/", "/login",
      "/onboarding/roles", "/onboarding/sharpen-the-saw", "/onboarding/fixed-appointments",
      "/onboarding/schedule-tasks", "/onboarding/complete",
      "/dashboard", "/roles", "/sharpen-the-saw", "/settings",
      "/evening-reflections", "/history", "/analytics",
      "/weekly-plan/goals", "/weekly-plan/sharpen-the-saw", "/weekly-plan/schedule",
    ]

    for (const route of routes) {
      await page.goto(route)
      await expect(page.locator("h1, h2").first()).toBeVisible()
    }

    expect(errors).toEqual([])
  })
})
