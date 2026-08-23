/** Task chips that drift up through the animated login background. */
export const FLOATING_TASKS = [
  { id: 1, text: "Morning meditation", color: "#B13BFF", delay: 0 },
  { id: 2, text: "Team standup", color: "#FFCC00", delay: 1.5 },
  { id: 3, text: "Deep work session", color: "#471396", delay: 3 },
  { id: 4, text: "Exercise routine", color: "#B13BFF", delay: 4.5 },
  { id: 5, text: "Weekly review", color: "#FFCC00", delay: 6 },
  { id: 6, text: "Family time", color: "#471396", delay: 7.5 },
]

/** Where a successful login sends a first-time user. */
export const ONBOARDING_HREF = "/onboarding/roles"

/** Where a successful login sends a user who has already onboarded. */
export const DASHBOARD_HREF = "/dashboard"

/**
 * The codes the backend's OAuth callback puts in `#error=`. Only `no_account` is a state the user
 * can do anything about — Google is a way into an existing account, so an address that has never
 * signed up needs the sign-up form, not a retry.
 */
export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  no_account:
    "No HabitFlow account uses that Google address. Sign up with your email first, then Continue with Google will sign you in.",
}

/** Shown for every other `#error=` code: nothing the user did, so the only advice is to try again. */
export const OAUTH_ERROR_FALLBACK = "Google sign-in failed. Please try again."
