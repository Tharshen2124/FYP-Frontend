import { test, expect } from "@playwright/test"
import { suppressEndOfDayModal } from "./helpers"

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
    await page.goto("/dashboard")

    for (const [label, href] of SIDEBAR_ROUTES) {
      await page.getByRole("link", { name: label, exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`${href}$`))
      await page.goto("/dashboard")
    }
  })

  test("the sidebar highlights the active route", async ({ page }) => {
    await page.goto("/analytics")
    const active = page.getByRole("link", { name: "Analytics", exact: true })
    await expect(active).toHaveClass(/text-primary/)
  })

  test("landing CTAs lead to login, and login leads into onboarding", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /Start Planning Free/ }).click()
    await expect(page).toHaveURL(/\/login$/)

    await page.getByRole("button", { name: "Sign In", exact: true }).last().click()
    await expect(page).toHaveURL(/\/onboarding\/roles$/)
  })

  test("dashboard links out to the weekly plan editor", async ({ page }) => {
    await page.goto("/dashboard")
    await page.getByRole("link", { name: /Edit Weekly Plan/ }).click()
    await expect(page).toHaveURL(/\/weekly-plan\/schedule$/)
  })

  test("sign out returns to the login page", async ({ page }) => {
    await page.goto("/dashboard")
    await page.getByRole("link", { name: /Sign Out/ }).click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test("every route renders without a client-side error", async ({ page }) => {
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
