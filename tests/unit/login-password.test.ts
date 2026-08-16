import { describe, it, expect } from "vitest"
import { getPasswordStrength, isValidEmail } from "@/app/login/_utils/password"

describe("getPasswordStrength", () => {
  it("is unrated when empty", () => {
    expect(getPasswordStrength("")).toEqual({ strength: 0, label: "" })
  })

  it("is weak below 6 characters", () => {
    expect(getPasswordStrength("abc")).toEqual({ strength: 1, label: "Weak" })
    expect(getPasswordStrength("abcde")).toEqual({ strength: 1, label: "Weak" })
  })

  it("is medium from 6 to 9 characters", () => {
    expect(getPasswordStrength("abcdef")).toEqual({ strength: 2, label: "Medium" })
    expect(getPasswordStrength("Abcdef1")).toEqual({ strength: 2, label: "Medium" })
  })

  it("is strong only at 10+ characters with an uppercase letter and a digit", () => {
    expect(getPasswordStrength("Abcdefghi1")).toEqual({ strength: 3, label: "Strong" })
    expect(getPasswordStrength("abcdefghij")).toEqual({ strength: 2, label: "Medium" })  // no upper/digit
    expect(getPasswordStrength("Abcdefghij")).toEqual({ strength: 2, label: "Medium" })  // no digit
    expect(getPasswordStrength("abcdefghi1")).toEqual({ strength: 2, label: "Medium" })  // no uppercase
  })
})

describe("isValidEmail", () => {
  it("accepts an address with an @ and a dot", () => {
    expect(isValidEmail("someone@example.com")).toBe(true)
  })

  it("rejects incomplete input", () => {
    expect(isValidEmail("")).toBe(false)
    expect(isValidEmail("someone")).toBe(false)
    expect(isValidEmail("someone@example")).toBe(false)
    expect(isValidEmail("example.com")).toBe(false)
  })
})
