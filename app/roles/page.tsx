"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { DEFAULT_COLOR_ID, DEFAULT_ICON_ID, MAX_RECOMMENDED_GOALS } from "./_constants/roles"
import { countGoals } from "./_utils/roles"
import { useRoles } from "./_utils/use-roles"
import { RoleCard } from "./_components/role-card"
import { RoleFormDialog } from "./_components/role-form-dialog"
import { ArchiveGoalDialog } from "./_components/archive-goal-dialog"
import { ArchiveRoleDialog } from "./_components/archive-role-dialog"
import { ArchivedRolesSection } from "./_components/archived-roles-section"
import { GoalLimitDialog } from "./_components/goal-limit-dialog"
import { GoalCountBadge } from "./_components/goal-count-badge"
import { AddRoleTile } from "./_components/add-role-tile"
import type { EditingGoal, Goal, PendingGoal, PendingRoleArchive, Role } from "./_types"

export default function RolesPage() {
  const {
    roles, archivedRoles, isLoading,
    addRole, editRole, previewArchive, archiveRole, restoreRole,
    addGoal, saveGoalText, toggleGoalPriority, archiveGoal,
  } = useRoles()

  const [roleDialogMode, setRoleDialogMode] = useState<"add" | "edit" | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [newRoleName, setNewRoleName] = useState("")
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_ICON_ID)
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR_ID)
  const [goalInputs, setGoalInputs] = useState<Record<string, string>>({})
  const [showGoalWarning, setShowGoalWarning] = useState(false)
  const [pendingGoal, setPendingGoal] = useState<PendingGoal | null>(null)
  const [roleToArchive, setRoleToArchive] = useState<PendingRoleArchive | null>(null)
  const [goalToArchive, setGoalToArchive] = useState<{ roleId: string; goal: Goal } | null>(null)
  const [editingGoal, setEditingGoal] = useState<EditingGoal | null>(null)

  const totalGoals = countGoals(roles)

  const resetRoleForm = () => {
    setNewRoleName("")
    setSelectedIcon(DEFAULT_ICON_ID)
    setSelectedColor(DEFAULT_COLOR_ID)
    setEditingRole(null)
    setRoleDialogMode(null)
  }

  const handleSubmitRoleForm = () => {
    const name = newRoleName.trim()
    if (!name) return
    if (editingRole) void editRole(editingRole.id, name, selectedIcon, selectedColor)
    else void addRole(name, selectedIcon, selectedColor)
    resetRoleForm()
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setNewRoleName(role.name)
    setSelectedIcon(role.iconId)
    setSelectedColor(role.colorId)
    setRoleDialogMode("edit")
  }

  /**
   * Archiving always confirms, even for a role with nothing in it this week: the counts shown are
   * this week's, and the role may still carry goals in weeks already behind you.
   */
  const handleArchiveRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (!role) return

    setRoleToArchive({ role, preview: null })
    const preview = await previewArchive(roleId)
    setRoleToArchive(current => (current?.role.id === roleId ? { role, preview } : current))
  }

  const handleConfirmArchiveRole = () => {
    if (!roleToArchive) return
    void archiveRole(roleToArchive.role)
    setRoleToArchive(null)
  }

  const attemptAddGoal = (roleId: string) => {
    const goalText = (goalInputs[roleId] || "").trim()
    if (!goalText) return
    if (totalGoals >= MAX_RECOMMENDED_GOALS) {
      setPendingGoal({ roleId, text: goalText })
      setShowGoalWarning(true)
      return
    }
    submitGoal(roleId, goalText)
  }

  const submitGoal = (roleId: string, goalText: string) => {
    setGoalInputs(prev => ({ ...prev, [roleId]: "" }))
    void addGoal(roleId, goalText)
  }

  const handleConfirmAddGoal = () => {
    if (pendingGoal) {
      submitGoal(pendingGoal.roleId, pendingGoal.text)
      setPendingGoal(null)
    }
    setShowGoalWarning(false)
  }

  const handleArchiveGoal = (roleId: string, goalId: string) => {
    const goal = roles.find(r => r.id === roleId)?.goals.find(g => g.id === goalId)
    if (goal) setGoalToArchive({ roleId, goal })
  }

  const handleConfirmArchiveGoal = () => {
    if (!goalToArchive) return
    void archiveGoal(goalToArchive.roleId, goalToArchive.goal)
    setGoalToArchive(null)
  }

  const handleSaveGoalEdit = () => {
    const trimmed = editingGoal?.text.trim()
    if (editingGoal && trimmed) void saveGoalText(editingGoal.roleId, editingGoal.goalId, trimmed)
    setEditingGoal(null)
  }

  const handleTogglePriority = (roleId: string, goalId: string) => {
    const goal = roles.find(r => r.id === roleId)?.goals.find(g => g.id === goalId)
    if (goal) void toggleGoalPriority(roleId, goal)
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
              Manage your life roles and set this week&apos;s goals for each one.
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

        {isLoading ? (
          <p className="text-muted-foreground font-serif">Loading your roles&hellip;</p>
        ) : (
          <>
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
                  onDeleteRole={roleId => { void handleArchiveRole(roleId) }}
                  onDeleteGoal={handleArchiveGoal}
                  onTogglePriority={handleTogglePriority}
                  onStartEditGoal={setEditingGoal}
                  onChangeEditGoal={setEditingGoal}
                  onSaveEditGoal={handleSaveGoalEdit}
                  onCancelEditGoal={() => setEditingGoal(null)}
                />
              ))}

              <AddRoleTile onClick={() => setRoleDialogMode("add")} />
            </div>

            <ArchivedRolesSection roles={archivedRoles} onRestore={roleId => { void restoreRole(roleId) }} />
          </>
        )}
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
        onSubmit={handleSubmitRoleForm}
      />

      <ArchiveGoalDialog
        open={!!goalToArchive}
        goalText={goalToArchive?.goal.text}
        onOpenChange={open => { if (!open) setGoalToArchive(null) }}
        onCancel={() => setGoalToArchive(null)}
        onConfirm={handleConfirmArchiveGoal}
      />

      <ArchiveRoleDialog
        pending={roleToArchive}
        onOpenChange={open => { if (!open) setRoleToArchive(null) }}
        onCancel={() => setRoleToArchive(null)}
        onConfirm={handleConfirmArchiveRole}
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
