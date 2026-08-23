import { test, expect } from "@playwright/test"
import { authenticateAsNewUser } from "./helpers"


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

test.describe("google sign-in", () => {
  // The backend refuses to open an account for an unknown Google address and sends the browser back
  // here with the reason in the hash. Landing straight on that URL is exactly what it does.
  test("an address with no account is told to sign up first", async ({ page }) => {
    await page.goto("/login#error=no_account")

    await expect(page.getByText(/No HabitFlow account uses that Google address/)).toBeVisible()
    // The reason is consumed, so a reload is not a second telling-off.
    await expect(page).toHaveURL(/\/login$/)
  })

  test("any other callback failure falls back to a retry message", async ({ page }) => {
    await page.goto("/login#error=token_exchange_failed")

    await expect(page.getByText("Google sign-in failed. Please try again.")).toBeVisible()
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
