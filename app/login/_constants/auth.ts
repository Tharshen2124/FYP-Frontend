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
 * Where a successful login sends an administrator — checked before the other two, because an admin
 * account does not run a week and `is_onboarded` says nothing about it.
 *
 * `middleware.ts` would turn a bounce to `/dashboard` back here anyway; sending them straight there
 * saves the redirect, and more to the point saves them a frame of a dashboard that is not theirs.
 */
export const ADMIN_HREF = "/admin/dashboard"

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

/**
 * The `#error=` code a ban arrives under, from the OAuth callback and from `lib/api.ts` when a
 * session is cut off mid-use. Deliberately absent from `OAUTH_ERROR_MESSAGES` above: every code in
 * that map becomes a toast, and a ban is the one refusal that gets a dialog instead.
 */
export const BANNED_ERROR = "banned"

export const BAN_TITLE = "Account banned"

/**
 * Both facts come from the server: the address is the account that was refused, and the contact is
 * backend config the browser holds no copy of.
 */
export function banMessage({ email, contactEmail }: { email: string; contactEmail: string }): string {
  return `You have been banned from using HabitFlow under the account ${email}. Please contact the admin via ${contactEmail} for any enquiries or clarification.`
}
