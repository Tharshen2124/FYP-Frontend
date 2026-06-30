import { Plus, Trash2, Star, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type Role, type Goal } from "../_types"
import { getIconComponent, getColor } from "../_constants"

interface Props {
  role: Role
  goalInput: string
  editingGoal: { roleId: string; goalId: string; text: string } | null
  onGoalInputChange: (roleId: string, value: string) => void
  onAddGoal: (roleId: string) => void
  onEditRole: (role: Role) => void
  onDeleteRole: (roleId: string) => void
  onTogglePriority: (roleId: string, goalId: string) => void
  onDeleteGoalRequest: (roleId: string, goal: Goal) => void
  onEditGoalStart: (roleId: string, goalId: string, text: string) => void
  onEditGoalChange: (text: string) => void
  onEditGoalSave: () => void
  onEditGoalCancel: () => void
}

export function RoleCard({
  role,
  goalInput,
  editingGoal,
  onGoalInputChange,
  onAddGoal,
  onEditRole,
  onDeleteRole,
  onTogglePriority,
  onDeleteGoalRequest,
  onEditGoalStart,
  onEditGoalChange,
  onEditGoalSave,
  onEditGoalCancel,
}: Props) {
  const IconComponent = getIconComponent(role.iconId)
  const color = getColor(role.colorId)

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/30 transition-colors">
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
          <Button variant="ghost" size="sm" onClick={() => onEditRole(role)} className="text-muted-foreground hover:text-foreground">Edit</Button>
          <Button variant="ghost" size="sm" onClick={() => onDeleteRole(role.id)} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {role.goals.map(goal => (
          <div key={goal.id} className={`flex items-center justify-between p-3 rounded-xl group transition-colors ${goal.isWeeklyPriority ? "bg-accent/10 border border-accent/30" : "bg-muted/50"}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {editingGoal?.goalId === goal.id ? (
                <>
                  <input
                    autoFocus
                    className="flex-1 bg-transparent text-foreground font-serif outline-none border-b border-primary"
                    value={editingGoal.text}
                    onChange={e => onEditGoalChange(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") onEditGoalSave()
                      if (e.key === "Escape") onEditGoalCancel()
                    }}
                  />
                  <button
                    onMouseDown={e => { e.preventDefault(); onEditGoalSave() }}
                    className="shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </button>
                </>
              ) : (
                <span
                  className="text-foreground font-serif cursor-text hover:text-primary transition-colors"
                  onClick={() => onEditGoalStart(role.id, goal.id, goal.text)}
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
                onClick={() => onTogglePriority(role.id, goal.id)}
                className={`p-1 h-auto transition-opacity ${goal.isWeeklyPriority ? "text-accent" : "text-muted-foreground hover:text-accent opacity-0 group-hover:opacity-100"}`}
                title={goal.isWeeklyPriority ? "Remove weekly priority" : "Mark as weekly priority"}
              >
                <Star className={`w-4 h-4 ${goal.isWeeklyPriority ? "fill-accent" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteGoalRequest(role.id, goal)}
                className="text-muted-foreground hover:text-destructive p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add a goal for this role..."
          value={goalInput}
          onChange={e => onGoalInputChange(role.id, e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && goalInput.trim()) onAddGoal(role.id) }}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
        <Button onClick={() => onAddGoal(role.id)} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
