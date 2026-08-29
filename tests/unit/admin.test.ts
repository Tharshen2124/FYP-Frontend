import { describe, it, expect } from "vitest"
import {
  humanStatus,
  money,
  monthFull,
  planLabel,
  planNote,
  monthLabel,
  percentLabel,
  rangeLabel,
  share,
  shortDate,
  subscriptionTone,
} from "@/app/admin/dashboard/_utils/format"
import { SUBSCRIPTION_TONES, TONE_COLORS } from "@/app/admin/dashboard/_constants/admin"

describe("money on the admin dashboard", () => {
  /* The same minor-unit conversion the pricing page depends on, reached through lib/plans.ts so
     the two cannot format the same amount differently. */
  it("renders minor units in the currency the payment was taken in", () => {
    expect(money(2500, "myr")).toMatch(/25\.00/)
    expect(money(150_000, "myr")).toMatch(/1,500\.00/)
  })

  /* A null currency means nothing has ever been paid. Printing "RM 0.00" would claim a currency
     this deployment has never charged in, which on the revenue card is a claim about the business. */
  it("says nothing rather than zero when no currency has been charged", () => {
    expect(money(0, null)).toBe("—")
    expect(money(2500, null)).toBe("—")
  })
})

describe("share", () => {
  it("rounds to a whole percent", () => {
    expect(share(1, 3)).toBe(33)
    expect(share(2, 3)).toBe(67)
    expect(share(5, 5)).toBe(100)
  })

  /* The first card anyone sees on a fresh deployment divides by a user count of zero. "NaN%" is a
     worse answer than 0%, and it is the answer a bare division gives. */
  it("is zero rather than NaN when nothing has happened yet", () => {
    expect(share(0, 0)).toBe(0)
    expect(Number.isNaN(share(3, 0))).toBe(false)
  })
})

describe("month labels", () => {
  /* `new Date("2026-08")` is parsed as UTC midnight, which is July for anyone west of Greenwich —
     so the axis would be labelled one month off for half the world. These parse the parts. */
  it("names the month the bucket actually is", () => {
    expect(monthLabel("2026-08")).toBe("Aug")
    expect(monthLabel("2026-01")).toBe("Jan")
    expect(monthLabel("2026-12")).toBe("Dec")
    expect(monthFull("2026-08")).toBe("August 2026")
  })
})

describe("dates", () => {
  it("renders an ISO date as a short date", () => {
    expect(shortDate("2026-08-29T10:00:00Z")).toMatch(/29 Aug 2026/)
  })

  /* A failed payment has no paid_at, and an account that has planned no week has no last week. */
  it("renders a missing date as a dash", () => {
    expect(shortDate(null)).toBe("—")
  })
})

describe("subscription statuses", () => {
  it("reads Stripe's snake_case as a person would", () => {
    expect(humanStatus("past_due")).toBe("Past due")
    expect(humanStatus("active")).toBe("Active")
    expect(humanStatus(null)).toBe("None")
  })

  it("sorts the statuses that mean paying, wobbling and not paying", () => {
    expect(subscriptionTone("active")).toBe("good")
    expect(subscriptionTone("trialing")).toBe("good")
    expect(subscriptionTone("past_due")).toBe("warning")
    expect(subscriptionTone("unpaid")).toBe("critical")
    expect(subscriptionTone("canceled")).toBe("neutral")
  })

  /* Stripe can add a status. One nobody anticipated has to show up greyed under its own name
     rather than crashing the table or vanishing from the breakdown. */
  it("falls back to neutral for a status nobody anticipated", () => {
    expect(subscriptionTone("some_future_stripe_status")).toBe("neutral")
    expect(subscriptionTone(null)).toBe("neutral")
  })

  it("has a colour for every tone it can produce", () => {
    for (const tone of Object.values(SUBSCRIPTION_TONES)) {
      expect(TONE_COLORS[tone]).toMatch(/^#[0-9a-f]{6}$/i)
    }
    expect(TONE_COLORS.neutral).toMatch(/^#[0-9a-f]{6}$/i)
  })

  /* Yellow is reserved app-wide: on every calendar in this app #FFCC00 means "weekly priority",
     and lib/role-colors.ts is its single definition. The warning tone here is a different amber
     on a page with no calendar on it, and it must not become a second claim on that exact value. */
  it("does not claim the reserved weekly-priority yellow", () => {
    const reserved = "#ffcc00"
    for (const color of Object.values(TONE_COLORS)) {
      expect(color.toLowerCase()).not.toBe(reserved)
    }
  })
})

describe("rangeLabel", () => {
  it("names the rows on the page, not the page number", () => {
    expect(rangeLabel(1, 25, 340)).toBe("1–25 of 340")
    expect(rangeLabel(3, 25, 340)).toBe("51–75 of 340")
  })

  /* The last page is short. Claiming 25 rows on a page showing 15 is the one thing this label
     can get wrong that a reader would notice. */
  it("stops the range at the total on the final page", () => {
    expect(rangeLabel(14, 25, 340)).toBe("326–340 of 340")
    expect(rangeLabel(1, 25, 3)).toBe("1–3 of 3")
  })

  it("says so when a search matched nothing", () => {
    expect(rangeLabel(1, 25, 0)).toBe("No results")
  })
})

describe("percentLabel", () => {
  it("rounds an ordinary share", () => {
    expect(percentLabel(1, 4)).toBe("25%")
    expect(percentLabel(2, 3)).toBe("67%")
  })

  /* Six premium accounts in three thousand rounds to 0%, and "6 · 0% of accounts" reads as a
     contradiction — the reader stops believing the percentage rather than the count. */
  it("says <1% rather than 0% for a real but tiny share", () => {
    expect(percentLabel(6, 3366)).toBe("<1%")
    expect(percentLabel(1, 1000)).toBe("<1%")
  })

  /* And the mirror: one account short of everyone must not round up to a clean 100%. */
  it("says >99% rather than 100% while one is still missing", () => {
    expect(percentLabel(999, 1000)).toBe(">99%")
    expect(percentLabel(1000, 1000)).toBe("100%")
  })

  it("is a flat 0% when there is genuinely nothing", () => {
    expect(percentLabel(0, 500)).toBe("0%")
    expect(percentLabel(0, 0)).toBe("0%")
  })
})

describe("the plan column", () => {
  /* The column is headed "Plan", and "Active" is the state of a subscription rather than the name
     of a plan — beside a money figure it reads as though the account is active, which they all are. */
  it("names the plan rather than Stripe's status", () => {
    expect(planLabel(true)).toBe("Premium")
    expect(planLabel(false)).toBe("Free")
  })

  it("adds no qualifier when the plan word already says everything", () => {
    expect(planNote(true, "active")).toBeNull()
    expect(planNote(false, null)).toBeNull()
  })

  /* The two cases the plan word cannot carry: a premium account that has not paid yet, and a free
     one that was paying until recently. */
  it("says how an account got where it is when the status adds something", () => {
    expect(planNote(true, "trialing")).toBe("Trialing")
    expect(planNote(false, "past_due")).toBe("Past due")
    expect(planNote(false, "canceled")).toBe("Canceled")
  })
})
