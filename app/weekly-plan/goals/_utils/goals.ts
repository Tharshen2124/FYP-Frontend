import type { ApiCarryForwardCandidate, ApiRole } from "@/lib/api"
import { getColor } from "@/lib/role-colors"
import type { Candidate, StagedGoal, WeekRole } from "../_types"

export function toWeekRole(role: ApiRole): WeekRole {
  return {
    id: String(role.role_id),
    name: role.name,
    color: getColor(role.color_id ?? "primary"),
    goals: role.goals.map(g => ({ id: String(g.goal_id), text: g.text })),
  }
}

/** Candidates arrive as one flat list; each card only wants its own role's. */
export function groupCandidatesByRole(
  candidates: ApiCarryForwardCandidate[]
): Record<string, Candidate[]> {
  const grouped: Record<string, Candidate[]> = {}
  for (const c of candidates) {
    const roleId = String(c.role_id)
    const candidate: Candidate = { id: String(c.goal_id), roleId, text: c.text }
    grouped[roleId] = [...(grouped[roleId] ?? []), candidate]
  }
  return grouped
}

export function countStaged(staged: Record<string, StagedGoal[]>): number {
  return Object.values(staged).reduce((sum, goals) => sum + goals.length, 0)
}

export function countCommitted(roles: WeekRole[]): number {
  return roles.reduce((sum, role) => sum + role.goals.length, 0)
}
