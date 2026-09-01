import { test, expect, type Page } from "@playwright/test"
import {
  authenticateAsNewUser,
  completeOnboarding,
  grantPremium,
  seedWeeklyPlan,
  seedPastWeek,
} from "./helpers"


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
  // The check-in time is a column on the user now, so this page reads the API and needs a session.
  test.beforeEach(async ({ page }) => {
    await authenticateAsNewUser(page)
  })

  /**
   * Stands in for a linked Google account, so the export tree can be exercised without a real
   * OAuth grant. Only the status read is intercepted -- the roles the tree is built from still
   * come from the live API, which is why a fresh user sees the four Sharpen the Saw dimensions
   * and no role children.
   */
  const connectedCalendar = (page: Page, premium = true) =>
    page.route("**/calendar", route =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          calendar: {
            connected: true,
            sync_enabled: true,
            export_preference: {
              fixed_appointments: true,
              excluded_dimensions: [],
              excluded_role_ids: [],
            },
            synced_at: null,
          },
          // Automatic sync is the paid half of this card. Every test below is about the switch
          // itself, so they run as a paid account; the free tier has its own two tests at the end.
          premium,
        }),
      })
    )

  test("offers to connect a calendar the account has not linked yet", async ({ page }) => {
    await page.goto("/settings")

    // A fresh account holds no Google grant, and this is the real API answering.
    await expect(page.getByRole("button", { name: "Connect Google Calendar" })).toBeVisible()
    await expect(page.getByText("Export Categories")).toHaveCount(0)
  })

  test("shows the Save bar only after a change, and Discard clears it", async ({ page }) => {
    await connectedCalendar(page)
    await page.goto("/settings")

    await expect(page.getByText("Google Calendar connected")).toBeVisible()
    await expect(page.getByText("You have unsaved changes.")).toHaveCount(0)

    await page.getByRole("checkbox", { name: "Fixed Appointments" }).click()
    await expect(page.getByText("You have unsaved changes.")).toBeVisible()

    await page.getByRole("button", { name: "Discard" }).click()
    await expect(page.getByText("You have unsaved changes.")).toHaveCount(0)
  })

  /**
   * The switch is the one control on this page that saves itself. It used to sit behind the Save
   * bar with the export tree, which read as broken: it flipped, nothing happened, and the bar it
   * was really waiting on is further down beside a different control. Auto-sync then silently
   * never ran, because the server had never been told.
   */
  test("the sync switch saves itself, without the Save bar", async ({ page }) => {
    await connectedCalendar(page)

    const patches: unknown[] = []
    await page.route("**/calendar/settings", route => {
      patches.push(JSON.parse(route.request().postData() ?? "{}"))
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          calendar: {
            connected: true,
            sync_enabled: false,
            export_preference: {
              fixed_appointments: true,
              excluded_dimensions: [],
              excluded_role_ids: [],
            },
            synced_at: null,
          },
          premium: true,
        }),
      })
    })

    await page.goto("/settings")

    const toggle = page.getByRole("switch", { name: "Allow Sync Changes" })

    // How far the thumb sits from the left of its track. The switch once styled `data-checked:`,
    // which Tailwind compiles to `[data-checked]` -- an attribute Radix never sets, since it writes
    // `data-state="checked"`. The track went unpainted and the thumb never moved, and nothing here
    // failed: aria-checked was correct all along, so the only sign the control worked was the toast.
    const thumbOffset = async () => {
      const track = await toggle.boundingBox()
      const thumb = await toggle.locator("[data-slot=switch-thumb]").boundingBox()
      return Math.round(thumb!.x - track!.x)
    }

    await expect(toggle).toHaveAttribute("aria-checked", "true")
    await expect.poll(thumbOffset).toBeGreaterThan(10)

    await toggle.click()

    await expect(page.getByText(/Automatic sync off/)).toBeVisible()
    await expect(toggle).toHaveAttribute("aria-checked", "false")
    await expect.poll(thumbOffset).toBeLessThan(10)
    expect(patches).toEqual([
      expect.objectContaining({ sync_enabled: false }),
    ])

    // And it is not left waiting on a Save the user has no reason to press.
    await expect(page.getByText("You have unsaved changes.")).toHaveCount(0)
  })

  // Flipping the switch must not quietly commit category edits that are still pending.
  test("the sync switch does not carry unsaved category edits with it", async ({ page }) => {
    await connectedCalendar(page)

    const patches: { export_preference?: { fixed_appointments?: boolean } }[] = []
    await page.route("**/calendar/settings", route => {
      patches.push(JSON.parse(route.request().postData() ?? "{}"))
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          calendar: {
            connected: true,
            sync_enabled: false,
            export_preference: {
              fixed_appointments: true,
              excluded_dimensions: [],
              excluded_role_ids: [],
            },
            synced_at: null,
          },
          premium: true,
        }),
      })
    })

    await page.goto("/settings")

    await page.getByRole("checkbox", { name: "Fixed Appointments" }).click()
    await expect(page.getByText("You have unsaved changes.")).toBeVisible()

    await page.getByRole("switch", { name: "Allow Sync Changes" }).click()
    await expect(page.getByText(/Automatic sync off/)).toBeVisible()

    expect(patches[0].export_preference?.fixed_appointments).toBe(true)
    // The tree edit is still pending, waiting on its own Save.
    await expect(page.getByText("You have unsaved changes.")).toBeVisible()
  })

  /**
   * Automatic sync is the paid half of this card, and the free half has to keep working around it
   * -- pushing a schedule to Google by hand is a Free feature the pricing page promises outright.
   */
  test("a free account gets the switch locked, and Sync now left alone", async ({ page }) => {
    await connectedCalendar(page, false)
    await page.goto("/settings")

    const toggle = page.getByRole("switch", { name: "Allow Sync Changes" })
    await expect(toggle).toBeDisabled()
    // Shown off rather than as stored: a switch reading "on" while nothing syncs is the failure
    // this card already had once.
    await expect(toggle).toHaveAttribute("aria-checked", "false")

    await expect(page.getByText(/Every edit reaches Google Calendar on its own/)).toBeVisible()
    await expect(page.getByRole("button", { name: "Sync now" })).toBeEnabled()
    await expect(page.getByRole("button", { name: "Disconnect" })).toBeEnabled()
  })

  test("a free account can still push by hand", async ({ page }) => {
    await connectedCalendar(page, false)

    await page.route("**/calendar/sync", route =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          weeks: 1,
          written: 3,
          deleted: 0,
          calendar: {
            connected: true,
            sync_enabled: true,
            export_preference: { fixed_appointments: true, excluded_dimensions: [], excluded_role_ids: [] },
            synced_at: "2026-08-25T07:03:10Z",
          },
          premium: false,
        }),
      })
    )

    await page.goto("/settings")
    await page.getByRole("button", { name: "Sync now" }).click()

    await expect(page.getByText("Synced 3 events")).toBeVisible()
  })

  /**
   * Connecting creates an empty calendar: auto-sync only fires on the next write, so a user who
   * connects and then changes nothing watches a blank calendar and concludes it does not work.
   * The offer to push is made once, on the visit the redirect lands on.
   */
  test("offers to push the first sync when the connect redirect lands", async ({ page }) => {
    await connectedCalendar(page)

    const syncs: string[] = []
    await page.route("**/calendar/sync", route => {
      syncs.push(route.request().method())
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          weeks: 1,
          written: 3,
          deleted: 0,
          calendar: {
            connected: true,
            sync_enabled: true,
            export_preference: { fixed_appointments: true, excluded_dimensions: [], excluded_role_ids: [] },
            synced_at: "2026-08-25T07:03:10Z",
          },
          premium: true,
        }),
      })
    })

    await page.goto("/settings#calendar=connected")

    const dialog = page.getByRole("alertdialog")
    await expect(dialog.getByRole("heading", { name: "You're connected" })).toBeVisible()
    await expect(dialog.getByText(/would you like us to push your tasks/)).toBeVisible()
    await dialog.getByRole("button", { name: "Yes, push them now" }).click()

    await expect(page.getByText("Synced 3 events")).toBeVisible()
    expect(syncs).toEqual([ "POST" ])
    // The freshly stamped time comes back with the sync response.
    await expect(page.getByText(/Last synced/)).toBeVisible()
  })

  test("declining the first push syncs nothing and leaves the Sync button to do it", async ({ page }) => {
    await connectedCalendar(page)

    const syncs: string[] = []
    await page.route("**/calendar/sync", route => {
      syncs.push(route.request().method())
      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
    })

    await page.goto("/settings#calendar=connected")

    const dialog = page.getByRole("alertdialog")
    await dialog.getByRole("button", { name: "No, I can click the Sync button later" }).click()

    await expect(page.getByRole("alertdialog")).toHaveCount(0)
    expect(syncs).toEqual([])
    await expect(page.getByRole("button", { name: "Sync now" })).toBeVisible()
  })

  // The fragment is cleared as it is read, so the offer belongs to the visit that connected and
  // does not follow the user around every later trip to this page.
  test("does not repeat the offer on a reload", async ({ page }) => {
    await connectedCalendar(page)
    await page.goto("/settings#calendar=connected")
    await expect(page.getByRole("alertdialog")).toBeVisible()

    await page.reload()

    await expect(page.getByRole("button", { name: "Sync now" })).toBeVisible()
    await expect(page.getByRole("alertdialog")).toHaveCount(0)
  })

  test("marks a parent category indeterminate when one child is off", async ({ page }) => {
    await connectedCalendar(page)
    await page.goto("/settings")

    const parent = page.getByRole("checkbox", { name: "Sharpen the Saw Activities" })
    await expect(parent).toHaveAttribute("aria-checked", "true")

    await page.getByRole("button", { name: /^Physical$/ }).click()
    await expect(parent).toHaveAttribute("aria-checked", "mixed")

    // Toggling the parent switches every child back on.
    await parent.click()
    await expect(parent).toHaveAttribute("aria-checked", "true")
  })

  // The time is a column on the user rather than a browser key, so the reload is the assertion:
  // it comes back from the API, not from this browser's storage.
  test("saves the end-of-day time against the account", async ({ page }) => {
    await page.goto("/settings")

    const field = page.getByLabel("Show check-in at")
    await expect(field).toHaveValue("23:59")

    await field.fill("20:15")
    await page.getByRole("button", { name: "Save", exact: true }).click()
    await expect(page.getByText("End-of-day time saved")).toBeVisible()

    await page.reload()
    await expect(page.getByLabel("Show check-in at")).toHaveValue("20:15")
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

    // The free tier's window is the three most recent finished weeks, and the strip stops there:
    // the server will not return the rest, so rows it could never fill would be rows that do
    // nothing. The button that widens the strip says what widens it instead.
    test("a free account sees three weeks and an offer instead of Load older", async ({ page }) => {
      await expect(page.locator("aside li button")).toHaveCount(3)
      await expect(page.getByRole("button", { name: "Load older weeks" })).toHaveCount(0)
      await expect(page.getByText("Free shows your last 3 weeks.")).toBeVisible()
      await expect(page.locator("aside").getByRole("link", { name: "Upgrade" })).toBeVisible()
    })

    test("a free account's date picker cannot reach behind the window", async ({ page }) => {
      const picker = page.locator("#jump-to-week")
      // Derived from the picker's own `max` rather than from the URL, which is stamped in by a
      // `router.replace` that may not have run yet when the test first looks.
      await expect(picker).toHaveAttribute("max", /\d{4}-\d{2}-\d{2}/)
      const newest = (await picker.getAttribute("max"))!

      // Three weeks inclusive of both ends, so the floor is two weeks back from the newest — the
      // same Monday the strip's last row shows, not one week further.
      const floor = await page.evaluate((iso: string) => {
        const d = new Date(`${iso}T00:00:00`)
        d.setDate(d.getDate() - 14)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      }, newest)

      await expect(picker).toHaveAttribute("min", floor)
    })

    // A hand-edited URL naming a week behind the window is clamped rather than left on a page the
    // server refuses -- the same treatment the live week already gets, and for the same reason.
    test("a free account's out-of-window URL is clamped, not left in error", async ({ page }) => {
      const behind = await page.evaluate(() => {
        const d = new Date()
        d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()) - 7 * 8)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      })

      await page.goto(`/history?week_start=${behind}`)

      await expect(page).not.toHaveURL(new RegExp(`week_start=${behind}`))
      await expect(page.getByRole("heading", { name: /Week of/ })).toBeVisible()
    })

    // The one history test that reads a real finished week end to end: the strip, its counts and
    // the widening all come from the live backend, with only the tier flipped on the way past.
    test("a paid account sees real counts and can load older weeks", async ({ page }) => {
      await seedPastWeek(page)
      await grantPremium(page, "**/history/weeks*")
      await page.goto("/history")

      const rows = page.locator("aside li button")
      await expect(rows).toHaveCount(8)
      // The seeded week is last week, so it heads the strip, and its badge is a real ratio rather
      // than the em dash an unplanned week shows.
      await expect(rows.first()).not.toContainText("—")

      await page.getByRole("button", { name: "Load older weeks" }).click()
      await expect(rows).toHaveCount(16)
    })
  })

  /**
   * The whole page is paid for, and the refusal is a 402 with no body — so unlike the other three
   * gated surfaces there is no flag on a real response to flip on the way past. The lock itself is
   * tested against the live backend below; the cards are tested against a stand-in week in the
   * shape `GET /analytics` returns, which is what the four cards actually derive from. That the
   * backend counts a week correctly is `test/controllers/analytics_controller_test.rb`'s job.
   */
  test.describe("analytics", () => {
    test.beforeEach(async ({ page }) => {
      await authenticateAsNewUser(page)
      await page.goto("/analytics")
    })

    /** Last Monday, from the browser's clock — every week_start in this app is a local date. */
    const lastMonday = (page: Page) =>
      page.evaluate(() => {
        const d = new Date()
        d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()) - 7)
        const iso = (x: Date) =>
          `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`
        const end = new Date(d)
        end.setDate(end.getDate() + 6)
        return { week_start: iso(d), end_date: iso(end) }
      })

    /**
     * Stands in for a paid account. `weeks` is exactly what the endpoint returns, so the page does
     * all of its own arithmetic — the percentages below are the client's, not the fixture's.
     */
    const paidAnalytics = async (page: Page, weeks: unknown[]) =>
      // Anchored on the API origin: `**/analytics*` would also match the page's own URL, and the
      // navigation would be answered with JSON instead of the app.
      page.route(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/analytics*`, route =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ weeks }),
        })
      )

    /** The same shape `seedPastWeek` produces: two physical renewals done, one mental, one
        spiritual scheduled and missed, and two goals of which one was achieved. */
    const seededWeek = (week: { week_start: string; end_date: string }) => ({
      ...week,
      dimensions: [
        { dimension: "physical", completed: 2, total: 2 },
        { dimension: "mental", completed: 1, total: 1 },
        { dimension: "spiritual", completed: 0, total: 1 },
      ],
      roles: [{ role_id: 1, name: "Professional", color_id: "purple", completed: 1, total: 2 }],
      daily_priorities: [{ day_of_week: 2, completed: 1, total: 1 }],
      goals: { achieved: 1, total: 2, dropped: 0 },
    })

    test("a free account is offered the upgrade in place, keeping the page's heading", async ({ page }) => {
      // No mock: this is the live backend refusing, which is the thing worth pinning.
      await expect(page.getByRole("heading", { name: /Your Analytics/ })).toBeVisible()
      await expect(page.getByRole("heading", { name: "Analytics is a Premium feature" })).toBeVisible()
      await expect(page.getByRole("link", { name: "Upgrade to Premium" })).toBeVisible()
      // A locked page is not a broken one.
      await expect(page.getByText(/Couldn't load your analytics/)).toHaveCount(0)
    })

    test("says so for a paid user with no finished week, rather than charting zeroes", async ({ page }) => {
      await paidAnalytics(page, [])
      await page.goto("/analytics")

      await expect(page.getByRole("heading", { name: /Your Analytics/ })).toBeVisible()
      await expect(page.getByRole("heading", { name: "Nothing to analyse yet" })).toBeVisible()
      await expect(page.getByRole("link", { name: "Plan a week" })).toBeVisible()
    })

    test("renders all four cards once a finished week exists", async ({ page }) => {
      await paidAnalytics(page, [ seededWeek(await lastMonday(page)) ])
      await page.goto("/analytics")

      for (const heading of [
        "Sharpen the Saw (STS) Balance",
        "Tasks Completed Per Role",
        "Daily Priority Hit Rate",
        "Weekly Goal Completion",
      ]) {
        await expect(page.getByRole("heading", { name: heading })).toBeVisible()
      }

      // Each filtered card exposes its own date selector.
      await expect(page.locator("select").first()).toBeVisible()
      await expect(page.getByText("Professional")).toBeVisible()

      // The balance card reads a *distribution*, not four completion rates: the seeded week
      // completed two physical Sharpen the Saw tasks and one mental, so physical holds 67% of the
      // Sharpen the Saw work and mental 33%. The legend rows are the four dimensions; the radar repeats their
      // names, which is why these are scoped to the legend rather than matched on the card.
      const sharpen = page.locator("div.rounded-2xl").filter({
        has: page.getByRole("heading", { name: "Sharpen the Saw (STS) Balance" }),
      })
      const legend = sharpen.locator("div.grid > div")
      await expect(sharpen.getByText("Dashed guide: an even 25% in every dimension")).toBeVisible()
      await expect(legend.filter({ hasText: "Physical" })).toContainText("67%")
      await expect(legend.filter({ hasText: "Mental" })).toContainText("33%")
      // The spiritual task was scheduled but never ticked off, so it is no part of the split.
      await expect(legend.filter({ hasText: "Spiritual" })).toContainText("0%")
    })

    test("explains what it measures behind a toggle on every card", async ({ page }) => {
      await paidAnalytics(page, [ seededWeek(await lastMonday(page)) ])
      await page.goto("/analytics")

      await expect(page.getByRole("button", { name: "How does this work?" })).toHaveCount(4)

      const sharpen = page.locator("div.rounded-2xl").filter({
        has: page.getByRole("heading", { name: "Sharpen the Saw (STS) Balance" }),
      })
      const toggle = sharpen.getByRole("button", { name: "How does this work?" })

      // Closed until asked for: the explanation runs to several sentences and would otherwise
      // push the chart it describes off the card.
      await expect(toggle).toHaveAttribute("aria-expanded", "false")
      await expect(sharpen.getByText(/slices of one pie/)).toHaveCount(0)

      await toggle.click()
      await expect(toggle).toHaveAttribute("aria-expanded", "true")
      await expect(sharpen.getByText(/slices of one pie/)).toBeVisible()
      await expect(sharpen.getByText(/weeks that have already finished/)).toBeVisible()

      await toggle.click()
      await expect(sharpen.getByText(/slices of one pie/)).toHaveCount(0)
    })
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
    await expect(page.getByRole("region", { name: "Calendar legend" })).toHaveCount(0)
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

    /* The legend names the week's own categories rather than claiming every task is one purple:
       onboarding leaves exactly one role-linked task ("Deep work", under "Professional") and one
       fixed appointment, and neither a weekly nor a daily priority — so those rows stay away. */
    const legend = page.getByRole("region", { name: "Calendar legend" })
    await expect(legend.getByText("Role goals", { exact: true })).toBeVisible()
    await expect(legend.getByText("Professional", { exact: true })).toBeVisible()
    await expect(legend.getByText("Fixed appointments", { exact: true })).toBeVisible()
    await expect(legend.getByText("Sharpen the Saw", { exact: true })).toHaveCount(0)
    await expect(legend.getByText("Daily priority", { exact: true })).toHaveCount(0)

    // Both of the items created in onboarding, read back from the backend.
    await expect(page.getByText("Team standup").first()).toBeVisible()
    await expect(page.getByText("Deep work").first()).toBeVisible()

    await expect(page.getByRole("heading", { name: /This week isn't planned yet/ })).toHaveCount(0)
  })

  /* completeOnboarding seeds exactly what these need: "Deep work" on Wednesday, linked to the
     role "Professional" and the goal "Complete quarterly project milestone", plus the fixed
     appointment "Team standup" on Monday. */

  test("a card opens a dialog naming what the task serves", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)

    await page.getByRole("button", { name: /^Deep work,/ }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "Deep work" })).toBeVisible()
    // The goal and the role behind the task — neither of which the card has room for.
    await expect(dialog.getByText("Complete quarterly project milestone")).toBeVisible()
    await expect(dialog.getByText("Professional", { exact: true })).toBeVisible()
    await expect(dialog.getByText("Role goal", { exact: true })).toBeVisible()
    await expect(dialog.getByText("Not completed yet")).toBeVisible()

    await dialog.getByRole("button", { name: "Close task details" }).click()
    await expect(page.getByRole("dialog")).toHaveCount(0)

    // A fixed appointment opens the same dialog, and says it is one rather than naming a goal.
    await page.getByRole("button", { name: /^Team standup,/ }).click()
    await expect(dialog.getByText("Fixed appointment", { exact: true })).toBeVisible()
    await expect(dialog.getByText("Goal", { exact: true })).toHaveCount(0)
  })

  test("ticking a task off in the dialog outlives a reload", async ({ page }) => {
    await authenticateAsNewUser(page)
    await completeOnboarding(page)

    await page.getByRole("button", { name: /^Deep work,/ }).click()

    const dialog = page.getByRole("dialog")
    await dialog.getByRole("button", { name: "Mark as done" }).click()

    // The dialog stays open and re-reads the patched plan, so the flip is its own confirmation.
    await expect(dialog.getByRole("button", { name: "Mark as not done" })).toBeVisible()
    await expect(dialog.getByText("Completed", { exact: true })).toBeVisible()

    await dialog.getByRole("button", { name: "Close task details" }).click()
    await expect(page.getByRole("button", { name: /^Deep work,.*completed$/ })).toBeVisible()

    // The assertion that proves the PATCH landed, rather than only the held plan being patched.
    await page.reload()
    await expect(page.getByRole("button", { name: /^Deep work,.*completed$/ })).toBeVisible()

    // And back off again, since a check-in is not a one-way door.
    await page.getByRole("button", { name: /^Deep work,/ }).click()
    await dialog.getByRole("button", { name: "Mark as not done" }).click()
    await expect(dialog.getByRole("button", { name: "Mark as done" })).toBeVisible()

    await page.reload()
    await expect(page.getByRole("button", { name: /^Deep work,/ })).toBeVisible()
    await expect(page.getByRole("button", { name: /^Deep work,.*completed$/ })).toHaveCount(0)
  })
})
