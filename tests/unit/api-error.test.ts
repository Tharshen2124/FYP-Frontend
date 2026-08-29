import { describe, it, expect } from "vitest"
import { ApiError, PAYMENT_REQUIRED, isPaymentRequired } from "@/lib/api"

/**
 * `request()` used to throw a plain Error and drop the status, which made "you have not paid for
 * this" indistinguishable from "that was invalid". These are the two properties the premium gates
 * rely on: the status survives, and the message still reads the way every existing caller expects.
 */
describe("ApiError", () => {
  it("is an Error, so callers that only read .message are unaffected", () => {
    const error = new ApiError("This is a Premium feature", PAYMENT_REQUIRED)

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe("This is a Premium feature")
  })

  it("carries the status alongside the message", () => {
    expect(new ApiError("nope", 422).status).toBe(422)
  })
})

describe("isPaymentRequired", () => {
  it("recognises the API's way of saying a feature is paid for", () => {
    expect(isPaymentRequired(new ApiError("This is a Premium feature", 402))).toBe(true)
  })

  it("does not confuse a refusal to pay with any other refusal", () => {
    // 403 in this app means a checkout session belonging to someone else — a different thing
    // entirely, and one an upgrade offer would be a nonsense answer to.
    expect(isPaymentRequired(new ApiError("forbidden", 403))).toBe(false)
    expect(isPaymentRequired(new ApiError("unprocessable", 422))).toBe(false)
    expect(isPaymentRequired(new ApiError("unauthorized", 401))).toBe(false)
  })

  it("is false for anything that is not an ApiError at all", () => {
    expect(isPaymentRequired(new Error("boom"))).toBe(false)
    expect(isPaymentRequired("402")).toBe(false)
    expect(isPaymentRequired(null)).toBe(false)
  })
})
