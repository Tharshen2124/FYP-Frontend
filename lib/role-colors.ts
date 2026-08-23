/**
 * The role colour palette, shared by every route that renders a role.
 *
 * It lives here rather than in `app/roles/_constants` because route-private folders may not be
 * imported across routes — `/weekly-plan/goals` needs the same colours the roles page assigns.
 * The backend stores only the id, so the hex value is resolved on the client.
 *
 * Yellow is deliberately absent. It is {@link WEEKLY_PRIORITY_COLOR}, and a role that could claim
 * it would make a yellow card on a calendar mean two different things.
 */
export const ROLE_COLORS = [
  { id: "primary", value: "#B13BFF", label: "Magenta" },
  { id: "secondary", value: "#471396", label: "Purple" },
  { id: "teal", value: "#14b8a6", label: "Teal" },
  { id: "rose", value: "#f43f5e", label: "Rose" },
  { id: "orange", value: "#f97316", label: "Orange" },
]

export const DEFAULT_COLOR_ID = "primary"

/**
 * The one yellow in the app, and what it means: this task serves a goal the user named a weekly
 * priority. Nothing else on a schedule may be drawn in it — not a role, not a Sharpen the Saw
 * dimension — which is the whole point of a reserved colour.
 *
 * A *daily* priority is a star, not a colour. The two are different claims: a weekly priority is a
 * property of the goal behind the task, a daily priority is a property of the task's day, and a
 * task can be either, both or neither.
 */
export const WEEKLY_PRIORITY_COLOR = "#FFCC00"

/**
 * A role's colour from its stored id.
 *
 * The fallback also catches `"accent"`, the yellow this palette used to offer. The migration that
 * removed it reassigned every stored row, so nothing should arrive with it — but a client holding
 * a stale role must still not paint it yellow.
 */
export function getColor(colorId: string): string {
  return ROLE_COLORS.find(c => c.id === colorId)?.value ?? "#B13BFF"
}
