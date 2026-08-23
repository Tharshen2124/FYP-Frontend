import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import type { ModalState } from "../_types/calendar"
import type { PlanDimension, PlanRole } from "../_types"
import { DAYS_SHORT, EMPTY_TASK_MODAL, WEEKLY_PRIORITY_COLOR } from "../_constants/calendar"
import { strToMins } from "../_utils/time"
import { getLinkMeta } from "../_utils/tasks"
import { isPastDayIndex } from "@/lib/date"

interface Props {
  modal: ModalState
  setModal: React.Dispatch<React.SetStateAction<ModalState>>
  onSave: () => void
  /** This week's roles with the goals they hold in it — not a standing library. */
  roles: PlanRole[]
  /**
   * Only the Sharpen the Saw activities committed to this week, as chosen on the weekly plan's
   * Sharpen the Saw step.
   */
  dimensions: PlanDimension[]
  /**
   * The column before which every day is refused, mirroring what the calendar behind the dialog
   * has already closed off; `null` when nothing is. That is today's column while planning, and
   * `null` on `/weekly-plan/edit`, where a day that has passed is still a day you can move work on
   * to.
   */
  blockedBefore: number | null
}

export function TaskModal({ modal, setModal, onSave, roles, dimensions, blockedBefore }: Props) {
  const endTimeInvalid = strToMins(modal.endTime) <= strToMins(modal.startTime)
  const canSave        = modal.title.trim().length > 0 && !endTimeInvalid && getLinkMeta(modal, roles, dimensions) !== null
  const selectedRole   = roles.find(r => r.id === modal.selectedRoleId)
  const selectedDim    = dimensions.find(d => d.id === modal.selectedDimensionId)

  return (
    <Dialog open={modal.open} onOpenChange={open => { if (!open) setModal(EMPTY_TASK_MODAL) }}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {modal.mode === "add" ? "Add Task" : "Edit Task"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-serif">
            {modal.mode === "add"
              ? "Schedule a task linked to a goal or Sharpen the Saw activity."
              : "Update the details of this task."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="space-y-1.5">
            <Label className="text-foreground font-bold">Task Name</Label>
            <Input
              autoFocus
              placeholder="e.g., Work on project report, Go for a run…"
              value={modal.title}
              onChange={e => setModal(m => ({ ...m, title: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") onSave() }}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground font-bold">Day</Label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_SHORT.map((d, i) => {
                // The day it already sits on stays clickable even when past, so opening a task to
                // rename it is never a one-way trip off its own day.
                const blocked = isPastDayIndex(blockedBefore, i) && modal.dayIndex !== i
                return (
                <button
                  key={d}
                  type="button"
                  disabled={blocked}
                  title={blocked ? "This day has passed" : undefined}
                  onClick={() => setModal(m => ({ ...m, dayIndex: i }))}
                  className={`py-2 rounded-sm text-xs font-bold transition-all ${
                    modal.dayIndex === i
                      ? "bg-primary text-primary-foreground"
                      : blocked
                        ? "bg-muted/40 text-muted-foreground/40 cursor-not-allowed"
                        : "bg-muted text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-foreground font-bold">From</Label>
              <Input
                type="time"
                value={modal.startTime}
                onChange={e => setModal(m => ({ ...m, startTime: e.target.value }))}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground font-bold">To</Label>
              <Input
                type="time"
                value={modal.endTime}
                onChange={e => setModal(m => ({ ...m, endTime: e.target.value }))}
                className="bg-muted border-border text-foreground"
              />
              {endTimeInvalid && modal.endTime && (
                <p className="text-xs text-destructive font-serif">Must be after start time</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-foreground font-bold">Link To</Label>
            <div className="flex rounded-xl overflow-hidden border-2 border-border">
              <button
                type="button"
                onClick={() => setModal(m => ({ ...m, linkType: "role-goal", selectedGoalId: "" }))}
                className={`flex-1 py-2 text-sm font-bold transition-all ${
                  modal.linkType === "role-goal"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Role Goal
              </button>
              <button
                type="button"
                onClick={() => setModal(m => ({ ...m, linkType: "sharpen-the-saw", selectedActivityId: "" }))}
                className={`flex-1 py-2 text-sm font-bold transition-all ${
                  modal.linkType === "sharpen-the-saw"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Sharpen the Saw
              </button>
            </div>

            {modal.linkType === "role-goal" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {roles.map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setModal(m => ({ ...m, selectedRoleId: role.id, selectedGoalId: "" }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                        modal.selectedRoleId === role.id
                          ? "text-background border-transparent"
                          : "bg-muted border-border text-muted-foreground hover:text-foreground"
                      }`}
                      style={modal.selectedRoleId === role.id ? { backgroundColor: role.color, borderColor: role.color } : {}}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>
                {roles.length === 0 && (
                  <p className="text-xs text-muted-foreground font-serif">
                    No roles with goals for this week yet — add some on the weekly plan&apos;s
                    Goals step first.
                  </p>
                )}
                {selectedRole && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-serif">
                      Select a goal from{" "}
                      <span className="font-bold" style={{ color: selectedRole.color }}>{selectedRole.name}</span>
                    </p>
                    <div className="space-y-1.5">
                      {selectedRole.goals.map(goal => (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => setModal(m => ({ ...m, selectedGoalId: goal.id }))}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-serif border-2 transition-all ${
                            modal.selectedGoalId === goal.id
                              ? "border-transparent text-background font-bold"
                              : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                          }`}
                          style={modal.selectedGoalId === goal.id ? { backgroundColor: selectedRole.color, borderColor: selectedRole.color } : {}}
                        >
                          {goal.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {modal.linkType === "sharpen-the-saw" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {dimensions.map(dim => {
                    const Icon     = dim.icon
                    const selected = modal.selectedDimensionId === dim.id
                    return (
                      <button
                        key={dim.id}
                        type="button"
                        onClick={() => setModal(m => ({ ...m, selectedDimensionId: dim.id, selectedActivityId: "" }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                          selected ? "text-background border-transparent" : "bg-muted border-border text-muted-foreground hover:text-foreground"
                        }`}
                        style={selected ? { backgroundColor: dim.color, borderColor: dim.color } : {}}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: selected ? "currentColor" : dim.color }} />
                        {dim.label}
                      </button>
                    )
                  })}
                </div>
                {dimensions.every(d => d.activities.length === 0) && (
                  <p className="text-xs text-muted-foreground font-serif">
                    You haven&apos;t committed to any Sharpen the Saw activities this week — pick
                    some on the weekly plan&apos;s Sharpen the Saw step.
                  </p>
                )}
                {selectedDim && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-serif">
                      Select an activity from{" "}
                      <span className="font-bold" style={{ color: selectedDim.color }}>{selectedDim.label}</span>
                    </p>
                    <div className="space-y-1.5">
                      {selectedDim.activities.map(act => (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => setModal(m => ({ ...m, selectedActivityId: act.id }))}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-serif border-2 transition-all ${
                            modal.selectedActivityId === act.id
                              ? "border-transparent text-background font-bold"
                              : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                          }`}
                          style={modal.selectedActivityId === act.id ? { backgroundColor: selectedDim.color, borderColor: selectedDim.color } : {}}
                        >
                          {act.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setModal(m => ({ ...m, isDailyPriority: !m.isDailyPriority }))}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
              modal.isDailyPriority
                ? "bg-accent/15 border-accent text-foreground"
                : "bg-muted border-border text-muted-foreground hover:border-accent/40 hover:text-foreground"
            }`}
          >
            <Star
              className={`w-5 h-5 flex-shrink-0 transition-colors ${modal.isDailyPriority ? "fill-current" : "text-muted-foreground"}`}
              style={modal.isDailyPriority ? { color: WEEKLY_PRIORITY_COLOR } : undefined}
            />
            <div className="text-left">
              <p className="text-sm font-bold">Mark as Daily Priority</p>
              <p className="text-xs font-serif text-muted-foreground mt-0.5">
                Flag this task as one of your most important to-dos for the day.
              </p>
            </div>
          </button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setModal(EMPTY_TASK_MODAL)}
            className="border-border text-foreground hover:bg-secondary/20"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!canSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {modal.mode === "add" ? "Add Task" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
