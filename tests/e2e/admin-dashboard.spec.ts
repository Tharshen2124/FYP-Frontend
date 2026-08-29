import { test, expect } from "@playwright/test"
import { authenticateAsNewUser, loginAsAdmin } from "./helpers"

test.describe("admin dashboard", () => {
  // The sidebar carries no admin link at all: an admin never reaches a page that renders it.
  test("the app sidebar offers no admin link to anyone", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/dashboard")

    await expect(page.getByRole("link", { name: "Admin", exact: true })).toHaveCount(0)
  })

  /* The claim decides the *link*; the server decides the *page*. Typing the URL is exactly the
     gesture that separates the two, and it must not be enough. */
  test("an ordinary account typing the URL is refused by the server", async ({ page }) => {
    await authenticateAsNewUser(page)
    await page.goto("/admin/dashboard")

    // The page answers rather than bouncing: its own heading stays, with the refusal under it.
    await expect(page.getByRole("heading", { name: /Admin Dashboard/ })).toBeVisible()
    await expect(page.getByText("This area is for administrators")).toBeVisible()
    await expect(page).toHaveURL(/\/admin\/dashboard$/)

    // And nothing it was refused leaks in beside the refusal.
    await expect(page.getByRole("region", { name: "Users" })).toHaveCount(0)
    await expect(page.getByRole("region", { name: "Payments" })).toHaveCount(0)
    await expect(page.getByRole("region", { name: "Key metrics" })).toHaveCount(0)
  })

  /* An admin account runs no week — it has no roles, goals or plan — so every app surface is
     turned back. This is the whole of "the admin has one page". */
  test("an admin is turned back from every app page", async ({ page }) => {
    await loginAsAdmin(page)

    for (const route of ["/dashboard", "/roles", "/settings", "/analytics", "/weekly-plan/goals"]) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/admin\/dashboard$/)
    }
  })

  test("an admin has no app sidebar, and signing out ends the session", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/dashboard")

    // None of the sidebar's nine links, because there is no sidebar.
    await expect(page.getByRole("link", { name: "Roles and Goals", exact: true })).toHaveCount(0)
    await expect(page.getByRole("link", { name: "Subscription", exact: true })).toHaveCount(0)
    await expect(page.getByText("Administration")).toBeVisible()

    await page.getByRole("button", { name: /Sign Out/ }).click()
    await page.waitForURL(/\/login$/)

    // And the app is reachable again for an ordinary account on the same browser.
    await authenticateAsNewUser(page)
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test("signing in as an admin lands on the admin page and shows every panel", async ({ page }) => {
    // loginAsAdmin waits for /dashboard or /onboarding/roles, so landing here is the assertion.
    await loginAsAdmin(page)
    await expect(page).toHaveURL(/\/admin\/dashboard$/)

    /* Scoped to the panel each label belongs to. "Active" and "Premium" are words that legitimately
       appear in three places on this page — a metric tile, a subscription state and a user's plan —
       so an unscoped match is ambiguous rather than wrong. */
    const metrics = page.getByRole("region", { name: "Key metrics" })
    for (const label of ["Accounts", "Active", "Premium", "Revenue"]) {
      await expect(metrics.getByText(label, { exact: true })).toBeVisible()
    }

    await expect(page.getByRole("region", { name: "Revenue by month" })).toBeVisible()
    await expect(page.getByRole("region", { name: "Subscription states" })).toBeVisible()

    /* The admin's own account is in the list it is looking at — reached by search rather than
       expected on page 1, since the list is newest-first and a long-lived dev database has
       thousands of signups ahead of a seeded account. */
    const users = page.getByRole("region", { name: "Users" })
    await users.getByRole("searchbox", { name: /Search users/ }).fill("admin@example.com")
    await expect(users.getByText("admin@example.com")).toBeVisible()
    /* The Plan column names a plan. "Active" is the state of a subscription, and on a row whose
       next column is a money figure it reads as though the account is active. */
    await expect(users.getByText("Free", { exact: true })).toBeVisible()
    await expect(page.getByRole("region", { name: "Payments" })).toBeVisible()
  })

  test("searching narrows the user list, and clearing it restores the list", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/dashboard")

    /* Scoped to the users panel: both tables have a pager, so "No results" is a sentence two
       panels can be saying at once. */
    const users = page.getByRole("region", { name: "Users" })
    const search = users.getByRole("searchbox", { name: /Search users/ })

    await search.fill("admin@example.com")
    await expect(users.getByText("1–1 of 1")).toBeVisible()

    await search.fill("definitely-no-such-account")
    await expect(users.getByText(/No account matches/)).toBeVisible()
    await expect(users.getByText("No results")).toBeVisible()

    await search.fill("")
    await expect(users.getByText(/^1–\d+ of \d+$/)).toBeVisible()
  })

  /* "%" is a valid thing to type into a search box and a SQL wildcard if it is not escaped, so an
     unescaped one returns every account — which looks like the search simply not working. */
  test("a wildcard in the search box matches nothing rather than everything", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/dashboard")

    const users = page.getByRole("region", { name: "Users" })
    await users.getByRole("searchbox", { name: /Search users/ }).fill("%")
    await expect(users.getByText(/No account matches/)).toBeVisible()
  })

  test("the payment filter narrows to failures and back", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/dashboard")

    const payments = page.getByRole("region", { name: "Payments" })

    await payments.getByRole("button", { name: "Failed", exact: true }).click()
    await expect(payments.getByRole("button", { name: "Failed", exact: true })).toHaveAttribute("aria-pressed", "true")

    await payments.getByRole("button", { name: "All", exact: true }).click()
    await expect(payments.getByRole("button", { name: "All", exact: true })).toHaveAttribute("aria-pressed", "true")
  })
})
