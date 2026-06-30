"use client"

import { useState } from "react"
import { Plus, Target, AlertTriangle } from "lucide-react"
import { AppNav } from "@/components/app-nav"
import { OnboardingStepper } from "@/components/onboarding-stepper"
import { MAX_RECOMMENDED_GOALS } from "./_constants"
import { type Role, type Goal } from "./_types"
import { RoleCard } from "./_components/role-card"
import { RoleDialog } from "./_components/role-dialog"
import { DeleteGoalModal } from "./_components/delete-goal-modal"
import { GoalWarningModal } from "./_components/goal-warning-modal"

const INITIAL_ROLES: Role[] = [
  {
    id: "1",
    name: "Professional",
    iconId: "briefcase",
    colorId: "primary",
    goals: [
      { id: "g1", text: "Complete quarterly project milestone" },
      { id: "g2", text: "Mentor junior team member" },
    ],
  },
  {
    id: "2",
    name: "Parent",
    iconId: "users",
    colorId: "accent",
    goals: [{ id: "g3", text: "Plan weekend family activity" }],
  },
]

export default function OnboardingRolesPage() {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleName, setRoleName] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("users")
  const [selectedColor, setSelectedColor] = useState("primary")
  const [goalInputs, setGoalInputs] = useState<Record<string, string>>({})
  const [showGoalWarning, setShowGoalWarning] = useState(false)
  const [pendingGoal, setPendingGoal] = useState<{ roleId: string; text: string } | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<{ roleId: string; goal: Goal } | null>(null)
  const [editingGoal, setEditingGoal] = useState<{ roleId: string; goalId: string; text: string } | null>(null)

  const totalGoals = roles.reduce((sum, r) => sum + r.goals.length, 0)

  const openAdd = () => {
    setRoleName("")
    setSelectedIcon("users")
    setSelectedColor("primary")
    setIsAddOpen(true)
  }

  const handleAddRole = () => {
    if (!roleName.trim()) return
    setRoles(prev => [...prev, { id: Date.now().toString(), name: roleName.trim(), iconId: selectedIcon, colorId: selectedColor, goals: [] }])
    setIsAddOpen(false)
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setRoleName(role.name)
    setSelectedIcon(role.iconId)
    setSelectedColor(role.colorId)
    setIsEditOpen(true)
  }

  const handleUpdateRole = () => {
    if (!editingRole || !roleName.trim()) return
    setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, name: roleName.trim(), iconId: selectedIcon, colorId: selectedColor } : r))
    setIsEditOpen(false)
    setEditingRole(null)
  }

  const handleDeleteRole = (roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId))
  }

  const addGoalToRole = (roleId: string, text: string) => {
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, goals: [...r.goals, { id: Date.now().toString(), text }] } : r))
    setGoalInputs(prev => ({ ...prev, [roleId]: "" }))
  }

  const attemptAddGoal = (roleId: string) => {
    const text = (goalInputs[roleId] || "").trim()
    if (!text) return
    if (totalGoals >= MAX_RECOMMENDED_GOALS) {
      setPendingGoal({ roleId, text })
      setShowGoalWarning(true)
      return
    }
    addGoalToRole(roleId, text)
  }

  const handleConfirmAddGoal = () => {
    if (pendingGoal) { addGoalToRole(pendingGoal.roleId, pendingGoal.text); setPendingGoal(null) }
    setShowGoalWarning(false)
  }

  const handleDeleteGoalRequest = (roleId: string, goal: Goal) => setGoalToDelete({ roleId, goal })

  const handleConfirmDeleteGoal = () => {
    if (goalToDelete) {
      setRoles(prev => prev.map(r => r.id === goalToDelete.roleId ? { ...r, goals: r.goals.filter(g => g.id !== goalToDelete.goal.id) } : r))
      setGoalToDelete(null)
    }
  }

  const handleEditGoalSave = () => {
    if (!editingGoal || !editingGoal.text.trim()) { setEditingGoal(null); return }
    setRoles(prev => prev.map(r =>
      r.id === editingGoal.roleId
        ? { ...r, goals: r.goals.map(g => g.id === editingGoal.goalId ? { ...g, text: editingGoal.text.trim() } : g) }
        : r
    ))
    setEditingGoal(null)
  }

  const handleTogglePriority = (roleId: string, goalId: string) => {
    setRoles(prev => prev.map(r =>
      r.id === roleId
        ? { ...r, goals: r.goals.map(g => g.id === goalId ? { ...g, isWeeklyPriority: !g.isWeeklyPriority } : g) }
        : r
    ))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav
        action="next"
        nextHref="/onboarding/sharpen-the-saw"
        nextEnabled={roles.length >= 1 && totalGoals >= 1}
        extra={
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {totalGoals} {totalGoals === 1 ? "Goal" : "Goals"}
            </span>
            {totalGoals > MAX_RECOMMENDED_GOALS && <AlertTriangle className="w-4 h-4 text-accent" />}
          </div>
        }
      />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <OnboardingStepper currentStep={1} />

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Define Your <span className="text-primary">Roles</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Identify the key roles in your life and set meaningful goals for each one.
              Focus on what matters most this week.
            </p>
          </div>

          {totalGoals > MAX_RECOMMENDED_GOALS && (
            <div className="mb-6 p-4 rounded-2xl bg-accent/10 border-2 border-accent/30 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">You have {totalGoals} goals this week</p>
                <p className="text-sm text-muted-foreground font-serif">
                  Consider focusing on fewer goals to increase your chances of success.
                  Research shows that limiting yourself to 7-10 weekly goals leads to better outcomes.
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
                onGoalInputChange={(id, val) => setGoalInputs(prev => ({ ...prev, [id]: val }))}
                onAddGoal={attemptAddGoal}
                onEditRole={handleEditRole}
                onDeleteRole={handleDeleteRole}
                onTogglePriority={handleTogglePriority}
                onDeleteGoalRequest={handleDeleteGoalRequest}
                onEditGoalStart={(roleId, goalId, text) => setEditingGoal({ roleId, goalId, text })}
                onEditGoalChange={text => setEditingGoal(prev => prev ? { ...prev, text } : null)}
                onEditGoalSave={handleEditGoalSave}
                onEditGoalCancel={() => setEditingGoal(null)}
              />
            ))}

            <button onClick={openAdd} className="p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <span className="text-lg font-bold text-muted-foreground group-hover:text-foreground transition-colors">Add New Role</span>
            </button>
          </div>
        </div>
      </main>

      <RoleDialog
        open={isAddOpen}
        mode="add"
        roleName={roleName}
        selectedIcon={selectedIcon}
        selectedColor={selectedColor}
        onOpenChange={setIsAddOpen}
        onRoleNameChange={setRoleName}
        onIconChange={setSelectedIcon}
        onColorChange={setSelectedColor}
        onConfirm={handleAddRole}
      />

      <RoleDialog
        open={isEditOpen}
        mode="edit"
        roleName={roleName}
        selectedIcon={selectedIcon}
        selectedColor={selectedColor}
        onOpenChange={setIsEditOpen}
        onRoleNameChange={setRoleName}
        onIconChange={setSelectedIcon}
        onColorChange={setSelectedColor}
        onConfirm={handleUpdateRole}
      />

      <DeleteGoalModal
        target={goalToDelete}
        onCancel={() => setGoalToDelete(null)}
        onConfirm={handleConfirmDeleteGoal}
      />

      <GoalWarningModal
        open={showGoalWarning}
        totalGoals={totalGoals}
        onCancel={() => { setPendingGoal(null); setShowGoalWarning(false) }}
        onConfirm={handleConfirmAddGoal}
      />
    </div>
  )
}
