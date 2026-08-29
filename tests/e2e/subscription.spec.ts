import { test, expect } from "@playwright/test"
import { authenticateAsNewUser } from "./helpers"

/*
 * Stripe's own pages are never driven here. Checkout and the Billing Portal are hosted by Stripe,
 * so what this app is responsible for is the two ends: the page that offers the plan, and what it
 * does with the outcome Stripe redirects back with. The return URLs are visited directly, exactly
 * as auth-flow.spec.ts visits the Google callback's outcome rather than signing into Google.
 */

test.describe("the subscription page", () => {
  test("an unauthenticated visit redirects to /login", async ({ page }) => {
    await page.goto("/subscription")
    await expect(page).toHaveURL(/\/login$/)
  })

  test("a new account is shown as Free, with both plans to compare", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/subscription")

    await expect(page.getByText("You're on Free")).toBeVisible()
    await expect(page.getByRole("heading", { name: "Compare plans" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Free", exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Premium", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: /Upgrade to Premium/ })).toBeVisible()
  })

  /* The price is read from Stripe rather than held as a constant, so this is the assertion that
     catches the whole chain going wrong at once -- a missing STRIPE_PRICE_ID, a price created in
     the wrong currency, or minor units rendered a hundred times too large. */
  test("quotes the Premium price as Stripe holds it", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/subscription")

    await expect(page.getByText(/RM\s?25\.00/)).toBeVisible()
    await expect(page.getByText("/ month")).toBeVisible()
  })

  // Nothing to manage until there is a Stripe customer, which only checking out creates.
  test("offers no billing portal to an account that has never checked out", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/subscription")

    await expect(page.getByText("You're on Free")).toBeVisible()
    await expect(page.getByRole("button", { name: /Manage subscription/ })).toHaveCount(0)
  })

  test("is reachable from the sidebar", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/dashboard")

    await page.getByRole("link", { name: "Subscription" }).click()
    await expect(page).toHaveURL(/\/subscription$/)
  })
})

test.describe("coming back from Stripe", () => {
  test("a cancelled checkout says so and leaves the account on Free", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/subscription?checkout=cancelled")

    await expect(page.getByText(/Checkout cancelled/)).toBeVisible()
    await expect(page.getByText("You're on Free")).toBeVisible()
    // The outcome is consumed as it is read, so a refresh is not a second telling.
    await expect(page).toHaveURL(/\/subscription$/)
  })

  /* A session id this account did not start is refused by the server. The page still has to render
     rather than break, because the account is genuinely still on Free and that is what it says. */
  test("a checkout session that is not ours does not grant Premium", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/subscription?checkout=success&session_id=cs_test_not_a_real_session")

    await expect(page.getByText("You're on Free")).toBeVisible()
    await expect(page).toHaveURL(/\/subscription$/)
  })
})

test.describe("the offer at the end of onboarding", () => {
  test("shows both plans and still lets Next through on Free", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/onboarding/complete")

    await expect(page.getByRole("heading", { name: "Choose your plan" })).toBeVisible()
    await expect(page.getByRole("button", { name: /Upgrade to Premium/ })).toBeVisible()

    await page.getByRole("button", { name: "Next", exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
