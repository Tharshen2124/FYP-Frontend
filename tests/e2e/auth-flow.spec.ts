import { test, expect } from "@playwright/test"
import { suppressEndOfDayModal, authenticateAsNewUser } from "./helpers"

test.beforeEach(async ({ page }) => {
  await suppressEndOfDayModal(page)
})

test.describe("auth guard", () => {
  test("an unauthenticated visit to /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login$/)
  })

  test("an unauthenticated visit to /onboarding/roles redirects to /login", async ({ page }) => {
    await page.goto("/onboarding/roles")
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe("login", () => {
  test("the wrong password shows an error and stays on /login", async ({ page }) => {
    const { email } = await authenticateAsNewUser(page)
    await page.goto("/login")

    await page.getByLabel("Email Address").fill(email)
    await page.getByLabel("Password", { exact: true }).fill("the-wrong-password")
    await page.locator("form").getByRole("button", { name: "Sign In", exact: true }).click()

    await expect(page.getByText("Invalid email or password")).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe("returning user", () => {
  test("a user who already completed onboarding logs in straight to /dashboard", async ({ page }) => {
    const { email, password } = await authenticateAsNewUser(page)

    // Finish onboarding once so the account is marked is_onboarded, then sign out.
    await page.goto("/onboarding/complete")
    await page.getByRole("button", { name: "Next", exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.getByRole("button", { name: /Sign Out/ }).click()
    await expect(page).toHaveURL(/\/login$/)

    // Logging back in should skip onboarding entirely this time.
    await page.getByLabel("Email Address").fill(email)
    await page.getByLabel("Password", { exact: true }).fill(password)
    await page.locator("form").getByRole("button", { name: "Sign In", exact: true }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
