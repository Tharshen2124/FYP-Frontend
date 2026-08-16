import type { PasswordInfo } from "../_types"

/**
 * Rates a password on a 0–3 scale.
 * Strong requires 10+ characters with at least one uppercase letter and one digit.
 */
export function getPasswordStrength(pass: string): PasswordInfo {
  if (pass.length === 0) return { strength: 0, label: "" }
  if (pass.length < 6) return { strength: 1, label: "Weak" }
  if (pass.length < 10) return { strength: 2, label: "Medium" }
  if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) return { strength: 3, label: "Strong" }
  return { strength: 2, label: "Medium" }
}

export function isValidEmail(email: string): boolean {
  return email.includes("@") && email.includes(".")
}
