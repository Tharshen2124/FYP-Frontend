/**
 * The role colour palette, shared by every route that renders a role.
 *
 * It lives here rather than in `app/roles/_constants` because route-private folders may not be
 * imported across routes — `/weekly-plan/goals` needs the same colours the roles page assigns.
 * The backend stores only the id, so the hex value is resolved on the client.
 */
export const ROLE_COLORS = [
  { id: "primary", value: "#B13BFF", label: "Magenta" },
  { id: "accent", value: "#FFCC00", label: "Yellow" },
  { id: "secondary", value: "#471396", label: "Purple" },
  { id: "teal", value: "#14b8a6", label: "Teal" },
  { id: "rose", value: "#f43f5e", label: "Rose" },
  { id: "orange", value: "#f97316", label: "Orange" },
]

export const DEFAULT_COLOR_ID = "primary"

export function getColor(colorId: string): string {
  return ROLE_COLORS.find(c => c.id === colorId)?.value ?? "#B13BFF"
}
