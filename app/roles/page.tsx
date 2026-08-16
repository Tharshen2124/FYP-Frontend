"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { DEFAULT_COLOR_ID, DEFAULT_ICON_ID, MAX_RECOMMENDED_GOALS } from "./_constants/roles"
import { INITIAL_ROLES } from "./_constants/mock-data"
import { countGoals } from "./_utils/roles"
import { RoleCard } from "./_components/role-card"
import { RoleFormDialog } from "./_components/role-form-dialog"
import { DeleteGoalDialog } from "./_components/delete-goal-dialog"
import { DeleteRoleDialog } from "./_components/delete-role-dialog"
import { GoalLimitDialog } from "./_components/goal-limit-dialog"
import { GoalCountBadge } from "./_components/goal-count-badge"
import { AddRoleTile } from "./_components/add-role-tile"
import type { EditingGoal, Goal, PendingGoal, Role } from "./_types"

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES)

  const [roleDialogMode, setRoleDialogMode] = useState<"add" | "edit" | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [newRoleName, setNewRoleName] = useState("")
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_ICON_ID)
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR_ID)
  const [goalInputs, setGoalInputs] = useState<Record<string, string>>({})
  const [showGoalWarning, setShowGoalWarning] = useState(false)
  const [pendingGoal, setPendingGoal] = useState<PendingGoal | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<{ roleId: string; goal: Goal } | null>(null)
  const [editingGoal, setEditingGoal] = useState<EditingGoal | null>(null)

  const totalGoals = countGoals(roles)

  const resetRoleForm = () => {
    setNewRoleName("")
    setSelectedIcon(DEFAULT_ICON_ID)
    setSelectedColor(DEFAULT_COLOR_ID)
    setEditingRole(null)
    setRoleDialogMode(null)
  }

  const handleAddRole = () => {
    if (!newRoleName.trim()) return
    setRoles([...roles, {
      id: Date.now().toString(),
      name: newRoleName.trim(),
      iconId: selectedIcon,
      colorId: selectedColor,
      goals: [],
    }])
    resetRoleForm()
  }

  /** Roles with goals need confirmation; empty roles are removed straight away. */
  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (!role) return
    if (role.goals.length > 0) setRoleToDelete(role)
    else setRoles(roles.filter(r => r.id !== roleId))
  }

  const handleConfirmDeleteRole = () => {
    if (!roleToDelete) return
    setRoles(roles.filter(r => r.id !== roleToDelete.id))
    setRoleToDelete(null)
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setNewRoleName(role.name)
    setSelectedIcon(role.iconId)
    setSelectedColor(role.colorId)
    setRoleDialogMode("edit")
  }

  const handleUpdateRole = () => {
    if (!editingRole || !newRoleName.trim()) return
    setRoles(roles.map(r =>
      r.id === editingRole.id
        ? { ...r, name: newRoleName.trim(), iconId: selectedIcon, colorId: selectedColor }
        : r
    ))
    resetRoleForm()
  }

  const attemptAddGoal = (roleId: string) => {
    const goalText = (goalInputs[roleId] || "").trim()
    if (!goalText) return
    if (totalGoals >= MAX_RECOMMENDED_GOALS) {
      setPendingGoal({ roleId, text: goalText })
      setShowGoalWarning(true)
      return
    }
    addGoalToRole(roleId, goalText)
  }

  const addGoalToRole = (roleId: string, goalText: string) => {
    const newGoal: Goal = { id: Date.now().toString(), text: goalText }
    setRoles(roles.map(r => (r.id === roleId ? { ...r, goals: [...r.goals, newGoal] } : r)))
    setGoalInputs(prev => ({ ...prev, [roleId]: "" }))
  }

  const handleConfirmAddGoal = () => {
    if (pendingGoal) {
      addGoalToRole(pendingGoal.roleId, pendingGoal.text)
      setPendingGoal(null)
    }
    setShowGoalWarning(false)
  }

  const handleDeleteGoal = (roleId: string, goalId: string) => {
    const goal = roles.find(r => r.id === roleId)?.goals.find(g => g.id === goalId)
    if (goal) setGoalToDelete({ roleId, goal })
  }

  const handleConfirmDeleteGoal = () => {
    if (!goalToDelete) return
    setRoles(roles.map(r =>
      r.id === goalToDelete.roleId
        ? { ...r, goals: r.goals.filter(g => g.id !== goalToDelete.goal.id) }
        : r
    ))
    setGoalToDelete(null)
  }

  const handleSaveGoalEdit = () => {
    if (!editingGoal || !editingGoal.text.trim()) {
      setEditingGoal(null)
      return
    }
    setRoles(roles.map(r =>
      r.id === editingGoal.roleId
        ? { ...r, goals: r.goals.map(g => (g.id === editingGoal.goalId ? { ...g, text: editingGoal.text.trim() } : g)) }
        : r
    ))
    setEditingGoal(null)
  }

  const handleTogglePriority = (roleId: string, goalId: string) => {
    setRoles(roles.map(r =>
      r.id === roleId
        ? { ...r, goals: r.goals.map(g => (g.id === goalId ? { ...g, isWeeklyPriority: !g.isWeeklyPriority } : g)) }
        : r
    ))
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto px-8 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
              Roles &amp; <span className="text-primary">Goals</span>
            </h1>
            <p className="text-muted-foreground font-serif">
              Manage your life roles and set meaningful goals for each one.
            </p>
          </div>
          <GoalCountBadge totalGoals={totalGoals} className="shrink-0" />
        </div>

        {totalGoals > MAX_RECOMMENDED_GOALS && (
          <div className="mb-6 p-4 rounded-2xl bg-accent/10 border-2 border-accent/30 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground">You have {totalGoals} goals</p>
              <p className="text-sm text-muted-foreground font-serif">
                Consider focusing on fewer goals. Research shows that limiting yourself to 7-10 goals leads to better outcomes.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {roles.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              goalInput={goalInputs[role.id] || ""}
              editingGoal={editingGoal}
              onGoalInputChange={value => setGoalInputs(prev => ({ ...prev, [role.id]: value }))}
              onAddGoal={() => attemptAddGoal(role.id)}
              onEditRole={handleEditRole}
              onDeleteRole={handleDeleteRole}
              onDeleteGoal={handleDeleteGoal}
              onTogglePriority={handleTogglePriority}
              onStartEditGoal={setEditingGoal}
              onChangeEditGoal={setEditingGoal}
              onSaveEditGoal={handleSaveGoalEdit}
              onCancelEditGoal={() => setEditingGoal(null)}
            />
          ))}

          <AddRoleTile onClick={() => setRoleDialogMode("add")} />
        </div>
      </main>

      <RoleFormDialog
        open={roleDialogMode !== null}
        mode={roleDialogMode ?? "add"}
        name={newRoleName}
        iconId={selectedIcon}
        colorId={selectedColor}
        onOpenChange={open => { if (!open) resetRoleForm() }}
        onNameChange={setNewRoleName}
        onIconChange={setSelectedIcon}
        onColorChange={setSelectedColor}
        onCancel={resetRoleForm}
        onSubmit={roleDialogMode === "edit" ? handleUpdateRole : handleAddRole}
      />

      <DeleteGoalDialog
        open={!!goalToDelete}
        goalText={goalToDelete?.goal.text}
        onOpenChange={open => { if (!open) setGoalToDelete(null) }}
        onCancel={() => setGoalToDelete(null)}
        onConfirm={handleConfirmDeleteGoal}
      />

      <DeleteRoleDialog
        role={roleToDelete}
        onOpenChange={open => { if (!open) setRoleToDelete(null) }}
        onCancel={() => setRoleToDelete(null)}
        onConfirm={handleConfirmDeleteRole}
      />

      <GoalLimitDialog
        open={showGoalWarning}
        totalGoals={totalGoals}
        onCancel={() => { setPendingGoal(null); setShowGoalWarning(false) }}
        onConfirm={handleConfirmAddGoal}
      />
    </div>
  )
}
