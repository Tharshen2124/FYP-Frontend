"use client"

import { useState } from "react"
import {
  Plus,
  Trash2,
  Target,
  AlertTriangle,
  X,
  Users,
  Briefcase,
  Heart,
  GraduationCap,
  Dumbbell,
  Home,
  Palette,
  Landmark,
  Star,
  Check
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const ROLE_ICONS = [
  { id: "users", icon: Users, label: "Family/Friends" },
  { id: "briefcase", icon: Briefcase, label: "Professional" },
  { id: "heart", icon: Heart, label: "Partner/Spouse" },
  { id: "graduation", icon: GraduationCap, label: "Student/Learner" },
  { id: "dumbbell", icon: Dumbbell, label: "Health/Fitness" },
  { id: "home", icon: Home, label: "Home/Personal" },
  { id: "palette", icon: Palette, label: "Creative" },
  { id: "landmark", icon: Landmark, label: "Community" },
]

const ROLE_COLORS = [
  { id: "primary", value: "#B13BFF", label: "Magenta" },
  { id: "accent", value: "#FFCC00", label: "Yellow" },
  { id: "secondary", value: "#471396", label: "Purple" },
  { id: "teal", value: "#14b8a6", label: "Teal" },
  { id: "rose", value: "#f43f5e", label: "Rose" },
  { id: "orange", value: "#f97316", label: "Orange" },
]

interface Goal {
  id: string
  text: string
  isWeeklyPriority?: boolean
}

interface Role {
  id: string
  name: string
  iconId: string
  colorId: string
  goals: Goal[]
}

const MAX_RECOMMENDED_GOALS = 10

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([
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
      goals: [
        { id: "g3", text: "Plan weekend family activity" },
      ],
    },
  ])

  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [newRoleName, setNewRoleName] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("users")
  const [selectedColor, setSelectedColor] = useState("primary")
  const [goalInputs, setGoalInputs] = useState<Record<string, string>>({})
  const [showGoalWarning, setShowGoalWarning] = useState(false)
  const [pendingGoal, setPendingGoal] = useState<{ roleId: string; text: string } | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<{ roleId: string; goal: Goal } | null>(null)
  const [editingGoal, setEditingGoal] = useState<{ roleId: string; goalId: string; text: string } | null>(null)

  const totalGoals = roles.reduce((sum, role) => sum + role.goals.length, 0)

  const getIconComponent = (iconId: string) => {
    const iconItem = ROLE_ICONS.find(i => i.id === iconId)
    return iconItem?.icon || Users
  }

  const getColor = (colorId: string) => {
    const colorItem = ROLE_COLORS.find(c => c.id === colorId)
    return colorItem?.value || "#B13BFF"
  }

  const handleAddRole = () => {
    if (!newRoleName.trim()) return
    const newRole: Role = {
      id: Date.now().toString(),
      name: newRoleName.trim(),
      iconId: selectedIcon,
      colorId: selectedColor,
      goals: [],
    }
    setRoles([...roles, newRole])
    setNewRoleName("")
    setSelectedIcon("users")
    setSelectedColor("primary")
    setIsAddRoleOpen(false)
  }

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (!role) return
    if (role.goals.length > 0) {
      setRoleToDelete(role)
    } else {
      setRoles(roles.filter(r => r.id !== roleId))
    }
  }

  const handleConfirmDeleteRole = () => {
    if (roleToDelete) {
      setRoles(roles.filter(r => r.id !== roleToDelete.id))
      setRoleToDelete(null)
    }
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setNewRoleName(role.name)
    setSelectedIcon(role.iconId)
    setSelectedColor(role.colorId)
    setIsEditRoleOpen(true)
  }

  const handleUpdateRole = () => {
    if (!editingRole || !newRoleName.trim()) return
    setRoles(roles.map(r =>
      r.id === editingRole.id
        ? { ...r, name: newRoleName.trim(), iconId: selectedIcon, colorId: selectedColor }
        : r
    ))
    setEditingRole(null)
    setNewRoleName("")
    setIsEditRoleOpen(false)
  }

  const attemptAddGoal = (roleId: string, goalText: string) => {
    if (!goalText.trim()) return
    if (totalGoals >= MAX_RECOMMENDED_GOALS) {
      setPendingGoal({ roleId, text: goalText.trim() })
      setShowGoalWarning(true)
      return
    }
    addGoalToRole(roleId, goalText.trim())
  }

  const addGoalToRole = (roleId: string, goalText: string) => {
    const newGoal: Goal = { id: Date.now().toString(), text: goalText }
    setRoles(roles.map(r =>
      r.id === roleId ? { ...r, goals: [...r.goals, newGoal] } : r
    ))
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
    const role = roles.find(r => r.id === roleId)
    const goal = role?.goals.find(g => g.id === goalId)
    if (goal) setGoalToDelete({ roleId, goal })
  }

  const handleConfirmDeleteGoal = () => {
    if (goalToDelete) {
      setRoles(roles.map(r =>
        r.id === goalToDelete.roleId ? { ...r, goals: r.goals.filter(g => g.id !== goalToDelete.goal.id) } : r
      ))
      setGoalToDelete(null)
    }
  }

  const handleSaveGoalEdit = () => {
    if (!editingGoal || !editingGoal.text.trim()) {
      setEditingGoal(null)
      return
    }
    setRoles(roles.map(r =>
      r.id === editingGoal.roleId
        ? { ...r, goals: r.goals.map(g => g.id === editingGoal.goalId ? { ...g, text: editingGoal.text.trim() } : g) }
        : r
    ))
    setEditingGoal(null)
  }

  const handleTogglePriority = (roleId: string, goalId: string) => {
    setRoles(roles.map(r =>
      r.id === roleId
        ? { ...r, goals: r.goals.map(g => g.id === goalId ? { ...g, isWeeklyPriority: !g.isWeeklyPriority } : g) }
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
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shrink-0">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {totalGoals} {totalGoals === 1 ? "Goal" : "Goals"}
            </span>
            {totalGoals > MAX_RECOMMENDED_GOALS && (
              <AlertTriangle className="w-4 h-4 text-accent" />
            )}
          </div>
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
          {roles.map((role) => {
            const IconComponent = getIconComponent(role.iconId)
            const color = getColor(role.colorId)
            return (
              <div key={role.id} className="p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                      <IconComponent className="w-6 h-6" style={{ color }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{role.name}</h2>
                      <p className="text-sm text-muted-foreground">{role.goals.length} {role.goals.length === 1 ? "goal" : "goals"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)} className="text-muted-foreground hover:text-foreground">Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(role.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {role.goals.map((goal) => (
                    <div key={goal.id} className={`flex items-center justify-between p-3 rounded-xl group transition-colors ${goal.isWeeklyPriority ? "bg-accent/10 border border-accent/30" : "bg-muted/50"}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        {editingGoal?.goalId === goal.id ? (
                          <>
                            <input
                              autoFocus
                              className="flex-1 bg-transparent text-foreground font-serif outline-none border-b border-primary"
                              value={editingGoal.text}
                              onChange={(e) => setEditingGoal({ ...editingGoal, text: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveGoalEdit()
                                if (e.key === "Escape") setEditingGoal(null)
                              }}
                            />
                            <button
                              onMouseDown={(e) => { e.preventDefault(); handleSaveGoalEdit() }}
                              className="shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5 text-primary-foreground" />
                            </button>
                          </>
                        ) : (
                          <span
                            className="text-foreground font-serif cursor-text hover:text-primary transition-colors"
                            onClick={() => setEditingGoal({ roleId: role.id, goalId: goal.id, text: goal.text })}
                          >
                            {goal.text}
                          </span>
                        )}
                        {goal.isWeeklyPriority && (
                          <span className="text-xs font-medium bg-accent/20 text-accent rounded-full px-2 py-0.5 whitespace-nowrap">Priority</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePriority(role.id, goal.id)}
                          className={`p-1 h-auto transition-opacity ${goal.isWeeklyPriority ? "text-accent" : "text-muted-foreground hover:text-accent opacity-0 group-hover:opacity-100"}`}
                          title={goal.isWeeklyPriority ? "Remove weekly priority" : "Mark as weekly priority"}
                        >
                          <Star className={`w-4 h-4 ${goal.isWeeklyPriority ? "fill-accent" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(role.id, goal.id)} className="text-muted-foreground hover:text-destructive p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a goal for this role..."
                    value={goalInputs[role.id] || ""}
                    onChange={(e) => setGoalInputs(prev => ({ ...prev, [role.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter" && (goalInputs[role.id] || "").trim()) attemptAddGoal(role.id, goalInputs[role.id] || "") }}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  />
                  <Button onClick={() => attemptAddGoal(role.id, goalInputs[role.id] || "")} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}

          <button onClick={() => setIsAddRoleOpen(true)} className="p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Plus className="w-7 h-7 text-primary" />
            </div>
            <span className="text-lg font-bold text-muted-foreground group-hover:text-foreground transition-colors">Add New Role</span>
          </button>
        </div>
      </main>

      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Role</DialogTitle>
            <DialogDescription className="text-muted-foreground font-serif">Define a role that represents an important area of your life.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Role Name</Label>
              <Input placeholder="e.g., Parent, Manager, Student..." value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="bg-muted border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Choose an Icon</Label>
              <div className="grid grid-cols-4 gap-2">
                {ROLE_ICONS.map((item) => {
                  const IconComp = item.icon
                  return (
                    <button key={item.id} onClick={() => setSelectedIcon(item.id)} className={`p-3 rounded-xl border-2 transition-all ${selectedIcon === item.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                      <IconComp className={`w-6 h-6 mx-auto ${selectedIcon === item.id ? "text-primary" : "text-muted-foreground"}`} />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Choose a Color</Label>
              <div className="flex gap-2">
                {ROLE_COLORS.map((color) => (
                  <button key={color.id} onClick={() => setSelectedColor(color.id)} className={`w-10 h-10 rounded-full transition-all ${selectedColor === color.id ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110" : "hover:scale-105"}`} style={{ backgroundColor: color.value }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleOpen(false)} className="border-border text-foreground hover:bg-secondary/20">Cancel</Button>
            <Button onClick={handleAddRole} disabled={!newRoleName.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">Add Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Role</DialogTitle>
            <DialogDescription className="text-muted-foreground font-serif">Update the details for this role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Role Name</Label>
              <Input placeholder="e.g., Parent, Manager, Student..." value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="bg-muted border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Choose an Icon</Label>
              <div className="grid grid-cols-4 gap-2">
                {ROLE_ICONS.map((item) => {
                  const IconComp = item.icon
                  return (
                    <button key={item.id} onClick={() => setSelectedIcon(item.id)} className={`p-3 rounded-xl border-2 transition-all ${selectedIcon === item.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                      <IconComp className={`w-6 h-6 mx-auto ${selectedIcon === item.id ? "text-primary" : "text-muted-foreground"}`} />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Choose a Color</Label>
              <div className="flex gap-2">
                {ROLE_COLORS.map((color) => (
                  <button key={color.id} onClick={() => setSelectedColor(color.id)} className={`w-10 h-10 rounded-full transition-all ${selectedColor === color.id ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110" : "hover:scale-105"}`} style={{ backgroundColor: color.value }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleOpen(false)} className="border-border text-foreground hover:bg-secondary/20">Cancel</Button>
            <Button onClick={handleUpdateRole} disabled={!newRoleName.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!goalToDelete} onOpenChange={(open) => { if (!open) setGoalToDelete(null) }}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Trash2 className="w-6 h-6 text-destructive" />
              Delete Goal?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-serif">
              Are you sure you want to delete{" "}
              <span className="font-bold text-foreground">&ldquo;{goalToDelete?.goal.text}&rdquo;</span>?
              <br /><br />
              This goal may be linked to scheduled tasks. Deleting it will not remove those tasks, but they will lose their goal association.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setGoalToDelete(null)} className="border-border text-foreground hover:bg-secondary/20">Cancel</Button>
            <Button onClick={handleConfirmDeleteGoal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Goal</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => { if (!open) setRoleToDelete(null) }}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Trash2 className="w-6 h-6 text-destructive" />
              Delete Role?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-serif">
              <span className="font-bold text-foreground">{roleToDelete?.name}</span> has{" "}
              <span className="font-bold text-foreground">{roleToDelete?.goals.length} {roleToDelete?.goals.length === 1 ? "goal" : "goals"}</span> associated with it.
              Deleting this role will permanently remove all its goals.
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setRoleToDelete(null)} className="border-border text-foreground hover:bg-secondary/20">Cancel</Button>
            <Button onClick={handleConfirmDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Role</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showGoalWarning}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
              <AlertTriangle className="w-6 h-6 text-accent" />
              Too Many Goals?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-serif">
              You already have <span className="font-bold text-foreground">{totalGoals} goals</span>.
              Adding more may reduce your effectiveness and increase overwhelm.
              <br /><br />
              <span className="text-foreground">&quot;The main thing is to keep the main thing the main thing.&quot;</span>
              <br />
              <span className="text-sm italic">— Stephen Covey</span>
              <br /><br />
              Are you sure you want to add this goal?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => { setPendingGoal(null); setShowGoalWarning(false) }} className="border-border text-foreground hover:bg-secondary/20">Go Back</Button>
            <Button onClick={handleConfirmAddGoal} className="bg-accent text-accent-foreground hover:bg-accent/90">Add Anyway</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
