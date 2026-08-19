"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { fromApiArchivedRole, fromApiPreview, fromApiRole, plural } from "./roles"
import type { ArchivedRole, ArchivePreview, Goal, Role } from "../_types"

/**
 * Owns everything the roles page persists. It lives here rather than in `page.tsx` so the page
 * stays a slim orchestrator of markup and dialog state.
 *
 * Every write is sent first and the local state patched from the response, matching
 * `/sharpen-the-saw`. Failures surface as a toast and leave the list as it was.
 */
export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [archivedRoles, setArchivedRoles] = useState<ArchivedRole[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.fetchStandingRoles()
      .then(({ roles, archived_roles }) => {
        if (cancelled) return
        setRoles(roles.map(fromApiRole))
        setArchivedRoles(archived_roles.map(fromApiArchivedRole))
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load your roles — please refresh.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const patchRole = (roleId: string, update: (role: Role) => Role) =>
    setRoles(prev => prev.map(r => (r.id === roleId ? update(r) : r)))

  const addRole = async (name: string, iconId: string, colorId: string) => {
    try {
      const { role } = await api.createRole({ role_name: name, icon_id: iconId, color_id: colorId })
      setRoles(prev => [...prev, fromApiRole(role)])
    } catch {
      toast.error("Couldn't add that role — please try again.")
    }
  }

  const editRole = async (roleId: string, name: string, iconId: string, colorId: string) => {
    try {
      await api.updateRole(Number(roleId), { role_name: name, icon_id: iconId, color_id: colorId })
      patchRole(roleId, r => ({ ...r, name, iconId, colorId }))
    } catch {
      toast.error("Couldn't save that role — please try again.")
    }
  }

  /** Loaded when the archive dialog opens so it can state what archiving would actually affect. */
  const previewArchive = useCallback(async (roleId: string): Promise<ArchivePreview | null> => {
    try {
      const { preview } = await api.fetchRoleArchivePreview(Number(roleId))
      return fromApiPreview(preview)
    } catch {
      toast.error("Couldn't check what that role affects — please try again.")
      return null
    }
  }, [])

  const archiveRole = async (role: Role) => {
    try {
      const { archived } = await api.archiveRole(Number(role.id))
      setRoles(prev => prev.filter(r => r.id !== role.id))
      setArchivedRoles(prev => [
        ...prev,
        { id: role.id, name: role.name, iconId: role.iconId, colorId: role.colorId, deletedAt: new Date().toISOString() },
      ])
      toast.success(`${role.name} archived`, { description: archiveSummary(fromApiPreview(archived)) })
    } catch {
      toast.error("Couldn't archive that role — please try again.")
    }
  }

  const restoreRole = async (roleId: string) => {
    try {
      const { role } = await api.restoreRole(Number(roleId))
      setArchivedRoles(prev => prev.filter(r => r.id !== roleId))
      setRoles(prev => [...prev, fromApiRole(role)])
    } catch {
      toast.error("Couldn't restore that role — please try again.")
    }
  }

  const addGoal = async (roleId: string, text: string) => {
    try {
      const { goal } = await api.createGoal({ role_id: Number(roleId), description: text })
      patchRole(roleId, r => ({
        ...r,
        goals: [...r.goals, { id: String(goal.goal_id), text: goal.text, isWeeklyPriority: goal.is_weekly_priority }],
      }))
    } catch {
      toast.error("Couldn't add that goal — please try again.")
    }
  }

  const saveGoalText = async (roleId: string, goalId: string, text: string) => {
    try {
      await api.updateGoal(Number(goalId), { description: text })
      patchRole(roleId, r => ({ ...r, goals: r.goals.map(g => (g.id === goalId ? { ...g, text } : g)) }))
    } catch {
      toast.error("Couldn't save that change — please try again.")
    }
  }

  const toggleGoalPriority = async (roleId: string, goal: Goal) => {
    const isWeeklyPriority = !goal.isWeeklyPriority
    try {
      await api.updateGoal(Number(goal.id), { is_weekly_priority: isWeeklyPriority })
      patchRole(roleId, r => ({
        ...r,
        goals: r.goals.map(g => (g.id === goal.id ? { ...g, isWeeklyPriority } : g)),
      }))
    } catch {
      toast.error("Couldn't update that goal — please try again.")
    }
  }

  /**
   * Removing a goal never erases what was already done under it: completed tasks stay on the
   * calendar and keep counting. Undo is what covers a mistake, so there is no hard delete.
   */
  const archiveGoal = async (roleId: string, goal: Goal) => {
    const index = roles.find(r => r.id === roleId)?.goals.findIndex(g => g.id === goal.id) ?? -1
    try {
      const { archived } = await api.archiveGoal(Number(goal.id))
      patchRole(roleId, r => ({ ...r, goals: r.goals.filter(g => g.id !== goal.id) }))
      toast.success("Goal removed", {
        description: archiveSummary(fromApiPreview(archived)),
        action: { label: "Undo", onClick: () => { void restoreGoal(roleId, goal, index) } },
      })
    } catch {
      toast.error("Couldn't remove that goal — please try again.")
    }
  }

  const restoreGoal = async (roleId: string, goal: Goal, index: number) => {
    try {
      await api.restoreGoal(Number(goal.id))
      patchRole(roleId, r => {
        const goals = [...r.goals]
        goals.splice(index < 0 ? goals.length : index, 0, goal)
        return { ...r, goals }
      })
    } catch {
      toast.error("Couldn't undo that — please try again.")
    }
  }

  return {
    roles, archivedRoles, isLoading,
    addRole, editRole, previewArchive, archiveRole, restoreRole,
    addGoal, saveGoalText, toggleGoalPriority, archiveGoal,
  }
}

/**
 * Unscheduling only ever removes tasks that were never done — the completed ones are the reason
 * the goal row is kept at all, so the toast says so rather than leaving it to be discovered.
 */
function archiveSummary({ incompleteTasks, completedTasks }: ArchivePreview): string | undefined {
  const parts: string[] = []
  if (incompleteTasks > 0) parts.push(`${incompleteTasks} unfinished ${plural(incompleteTasks, "task")} unscheduled`)
  if (completedTasks > 0) parts.push(`${completedTasks} completed ${plural(completedTasks, "task")} kept`)
  return parts.length > 0 ? parts.join(" · ") : undefined
}
