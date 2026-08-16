export type PasswordStrength = 0 | 1 | 2 | 3

export interface PasswordInfo {
  strength: PasswordStrength
  label: "" | "Weak" | "Medium" | "Strong"
}

/** Which input currently has focus, used to tint its leading icon. */
export type FocusedField = "email" | "username" | "password" | null
