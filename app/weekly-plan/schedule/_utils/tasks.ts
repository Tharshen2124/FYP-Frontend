import type { ModalState } from "../_types"
import { MOCK_ROLES, MOCK_DIMENSIONS } from "../../_constants/mock-data"

export function getLinkMeta(
  modal: Pick<
    ModalState,
    "linkType" | "selectedRoleId" | "selectedGoalId" | "selectedDimensionId" | "selectedActivityId"
  >
): { color: string; label: string } | null {
  if (modal.linkType === "role-goal") {
    const role = MOCK_ROLES.find(r => r.id === modal.selectedRoleId)
    const goal = role?.goals.find(g => g.id === modal.selectedGoalId)
    if (!role || !goal) return null
    return { color: role.color, label: `${role.name} — ${goal.text}` }
  }

  const dim = MOCK_DIMENSIONS.find(d => d.id === modal.selectedDimensionId)
  const act = dim?.activities.find(a => a.id === modal.selectedActivityId)
  if (!dim || !act) return null
  return { color: dim.color, label: `${dim.label} — ${act.text}` }
}
