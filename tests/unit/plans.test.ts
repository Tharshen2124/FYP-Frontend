import { describe, it, expect } from "vitest"
import { FREE_PLAN, PLANS, PREMIUM_PLAN, formatPrice } from "@/lib/plans"
import { ROLE_COLORS, WEEKLY_PRIORITY_COLOR } from "@/lib/role-colors"

describe("the plan catalogue", () => {
  /* The two columns are read across, line by line. If one tier listed a feature the other did not,
     the rows would stop lining up and the comparison would silently become two unrelated lists. */
  it("lists the same features in the same order on both tiers", () => {
    expect(FREE_PLAN.features.map(f => f.label)).toEqual(PREMIUM_PLAN.features.map(f => f.label))
  })

  it("gives Premium everything", () => {
    expect(PREMIUM_PLAN.features.every(f => f.included)).toBe(true)
  })

  /* The four the brief withholds: automatic calendar sync, unlimited history, the analytics
     dashboard and the AI weekly summary. If this number moves, the pricing page is claiming
     something different from what was agreed. */
  it("withholds exactly four features from Free", () => {
    const withheld = FREE_PLAN.features.filter(f => !f.included).map(f => f.label)
    expect(withheld).toHaveLength(4)
    expect(withheld.join(" ")).toMatch(/Sync calendar edits/)
    expect(withheld.join(" ")).toMatch(/Unlimited history/)
    expect(withheld.join(" ")).toMatch(/Analytics dashboard/)
    expect(withheld.join(" ")).toMatch(/AI weekly summary/)
  })

  it("gives Free everything needed to plan and run a week", () => {
    const included = FREE_PLAN.features.filter(f => f.included).map(f => f.label)
    expect(included.join(" ")).toMatch(/Schedule your weekly plans/)
    expect(included.join(" ")).toMatch(/Google Calendar/)
    expect(included.join(" ")).toMatch(/Daily check-ins/)
  })

  it("is keyed by its own id", () => {
    expect(PLANS.free.id).toBe("free")
    expect(PLANS.premium.id).toBe("premium")
  })
})

describe("formatPrice", () => {
  /* RM 25.00 reaches the browser as 2500 minor units. Getting this wrong by a factor of a hundred
     is the one formatting bug a pricing page cannot survive. */
  it("renders MYR minor units as ringgit", () => {
    expect(formatPrice(2500, "myr")).toMatch(/25\.00/)
  })

  it("accepts the currency in either case", () => {
    expect(formatPrice(2500, "MYR")).toBe(formatPrice(2500, "myr"))
  })

  /* Stripe reports a zero-decimal currency in whole units already, so dividing by 100 would be
     wrong there. Intl knows which currencies those are, which is why it does the division. */
  it("does not divide a zero-decimal currency", () => {
    expect(formatPrice(2500, "jpy")).toMatch(/2,500/)
  })
})

/* Yellow means one thing on a calendar: a task serving a weekly priority. The pricing page uses it
   only as a CTA button, which the design guidelines reserve it for -- but the Premium column must
   not start claiming it as a tier colour, which is the way it would creep back onto a schedule. */
describe("the reserved yellow", () => {
  it("is still claimed by no role colour", () => {
    expect(ROLE_COLORS.map(c => c.value)).not.toContain(WEEKLY_PRIORITY_COLOR)
  })
})
