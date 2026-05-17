"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Target, 
  AlertTriangle,
  X,
  ChevronRight,
  Users,
  Briefcase,
  Heart,
  GraduationCap,
  Dumbbell,
  Home,
  Palette,
  Landmark
} from "lucide-react"
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

// Role icons mapping
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

// Color options for roles
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

  // Calculate total goals
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
    setRoles(roles.filter(r => r.id !== roleId))
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

    // Check if adding this goal would exceed the recommended limit
    if (totalGoals >= MAX_RECOMMENDED_GOALS) {
      setPendingGoal({ roleId, text: goalText.trim() })
      setShowGoalWarning(true)
      return
    }

    addGoalToRole(roleId, goalText.trim())
  }

  const addGoalToRole = (roleId: string, goalText: string) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      text: goalText,
    }

    setRoles(roles.map(r => 
      r.id === roleId 
        ? { ...r, goals: [...r.goals, newGoal] }
        : r
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
    setRoles(roles.map(r => 
      r.id === roleId 
        ? { ...r, goals: r.goals.filter(g => g.id !== goalId) }
        : r
    ))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4 border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">HabitFlow</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {totalGoals} {totalGoals === 1 ? "Goal" : "Goals"}
              </span>
              {totalGoals > MAX_RECOMMENDED_GOALS && (
                <AlertTriangle className="w-4 h-4 text-accent" />
              )}
            </div>
            {roles.length >= 1 && totalGoals >= 1 ? (
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-secondary/20"
                asChild
              >
                <Link href="/sharpen-the-saw">
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-border text-foreground"
                disabled
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Define Your <span className="text-primary">Roles</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Identify the key roles in your life and set meaningful goals for each one. 
              Focus on what matters most this week.
            </p>
          </div>

          {/* Goals Warning Banner */}
          {totalGoals > MAX_RECOMMENDED_GOALS && (
            <div className="mb-6 p-4 rounded-2xl bg-accent/10 border-2 border-accent/30 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">
                  You have {totalGoals} goals this week
                </p>
                <p className="text-sm text-muted-foreground font-serif">
                  Consider focusing on fewer goals to increase your chances of success. 
                  Research shows that limiting yourself to 7-10 weekly goals leads to better outcomes.
                </p>
              </div>
            </div>
          )}

          {/* Roles Grid */}
          <div className="grid gap-6">
            {roles.map((role) => {
              const IconComponent = getIconComponent(role.iconId)
              const color = getColor(role.colorId)

              return (
                <div
                  key={role.id}
                  className="p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/30 transition-colors"
                >
                  {/* Role Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <IconComponent className="w-6 h-6" style={{ color }} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">{role.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {role.goals.length} {role.goals.length === 1 ? "goal" : "goals"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Goals List */}
                  <div className="space-y-2 mb-4">
                    {role.goals.map((goal) => (
                      <div
                        key={goal.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/50 group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-foreground font-serif">{goal.text}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGoal(role.id, goal.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add Goal Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a goal for this role..."
                      value={goalInputs[role.id] || ""}
                      onChange={(e) => setGoalInputs(prev => ({ ...prev, [role.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (goalInputs[role.id] || "").trim()) {
                          attemptAddGoal(role.id, goalInputs[role.id] || "")
                        }
                      }}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                    />
                    <Button
                      onClick={() => attemptAddGoal(role.id, goalInputs[role.id] || "")}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}

            {/* Add Role Card */}
            <button
              onClick={() => setIsAddRoleOpen(true)}
              className="p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <span className="text-lg font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                Add New Role
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Role</DialogTitle>
            <DialogDescription className="text-muted-foreground font-serif">
              Define a role that represents an important area of your life.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Role Name */}
            <div className="space-y-2">
              <Label className="text-foreground">Role Name</Label>
              <Input
                placeholder="e.g., Parent, Manager, Student..."
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Icon Selection */}
            <div className="space-y-2">
              <Label className="text-foreground">Choose an Icon</Label>
              <div className="grid grid-cols-4 gap-2">
                {ROLE_ICONS.map((item) => {
                  const IconComp = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedIcon(item.id)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedIcon === item.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <IconComp className={`w-6 h-6 mx-auto ${
                        selectedIcon === item.id ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <Label className="text-foreground">Choose a Color</Label>
              <div className="flex gap-2">
                {ROLE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`w-10 h-10 rounded-full transition-all ${
                      selectedColor === color.id
                        ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddRoleOpen(false)}
              className="border-border text-foreground hover:bg-secondary/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRole}
              disabled={!newRoleName.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Role</DialogTitle>
            <DialogDescription className="text-muted-foreground font-serif">
              Update the details for this role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Role Name */}
            <div className="space-y-2">
              <Label className="text-foreground">Role Name</Label>
              <Input
                placeholder="e.g., Parent, Manager, Student..."
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Icon Selection */}
            <div className="space-y-2">
              <Label className="text-foreground">Choose an Icon</Label>
              <div className="grid grid-cols-4 gap-2">
                {ROLE_ICONS.map((item) => {
                  const IconComp = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedIcon(item.id)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedIcon === item.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <IconComp className={`w-6 h-6 mx-auto ${
                        selectedIcon === item.id ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <Label className="text-foreground">Choose a Color</Label>
              <div className="flex gap-2">
                {ROLE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={`w-10 h-10 rounded-full transition-all ${
                      selectedColor === color.id
                        ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditRoleOpen(false)}
              className="border-border text-foreground hover:bg-secondary/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={!newRoleName.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Warning Alert Dialog */}
      <AlertDialog open={showGoalWarning}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
              <AlertTriangle className="w-6 h-6 text-accent" />
              Too Many Goals?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-serif">
              You already have <span className="font-bold text-foreground">{totalGoals} goals</span> for this week. 
              Adding more may reduce your effectiveness and increase overwhelm.
              <br /><br />
              <span className="text-foreground">
                &quot;The main thing is to keep the main thing the main thing.&quot;
              </span>
              <br />
              <span className="text-sm italic">— Stephen Covey</span>
              <br /><br />
              Consider completing or removing some goals before adding new ones. 
              Are you sure you want to add this goal?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPendingGoal(null)
                setShowGoalWarning(false)
              }}
              className="border-border text-foreground hover:bg-secondary/20"
            >
              Go Back
            </Button>
            <Button
              onClick={() => {
                handleConfirmAddGoal()
              }}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Add Anyway
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
