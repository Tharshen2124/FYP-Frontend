"use client"

import { useState } from "react"
import { Check, Loader2, Lock, Star, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { taskDetail } from "../_utils/events"
import { fmtDuration, fmtShortDate, fmtTime, strToMins } from "../_utils/time"
import { DAYS_FULL, WEEKLY_PRIORITY_COLOR } from "../_constants/calendar"
import type { ApiTask } from "../_types"

interface Props {
  /** The task to show, or null when nothing is selected — this is what opens the dialog. */
  task: ApiTask | null
  /** This task's column date. Null until the week resolves on the client. */
  date: Date | null
  onClose: () => void
  /** Same shape the End-of-Day check-in reports, so both share the parent's one patch function. */
  onCompletionChange: (changed: { id: string; isCompleted: boolean }[]) => void
}

export function TaskDetailModal({ task, date, onClose, onCompletionChange }: Props) {
  const [isSaving, setIsSaving] = useState(false)

  /* Sent first, then the parent patches the plan it holds — the house rule for every write here.
     `task` is derived from that plan, so the button and the card behind flip together and the
     change is its own confirmation. Nothing closes: reading a task and ticking it are one visit. */
  const handleToggle = async () => {
    if (task === null) return
    const next = !task.is_completed

    setIsSaving(true)
    try {
      await api.setTaskCompletion(task.task_id, next)
      onCompletionChange([{ id: String(task.task_id), isCompleted: next }])
    } catch {
      toast.error("Couldn't update that task — please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const detail = task && taskDetail(task)
  const startMins = task ? strToMins(task.start_time) : 0
  const endMins = task ? strToMins(task.end_time) : 0

  return (
    <Dialog open={task !== null} onOpenChange={open => { if (!open && !isSaving) onClose() }}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        {task && detail && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${detail.color}22` }}
                >
                  {task.is_fixed_appointment ? (
                    <Lock className="w-5 h-5" style={{ color: detail.color }} />
                  ) : (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: detail.color }} />
                  )}
                </div>
                <div className="min-w-0">
                  {/* Wraps rather than truncates. Reading the whole name is half of why this
                      dialog exists — the card it was opened from cuts it off. */}
                  <DialogTitle className="text-xl font-bold text-foreground leading-tight break-words">
                    {task.title}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground font-serif mt-1">
                    {DAYS_FULL[task.day_of_week]}
                    {date && ` ${fmtShortDate(date)}`}
                    {" · "}
                    {fmtTime(startMins)} – {fmtTime(endMins)}
                    {" · "}
                    {fmtDuration(endMins - startMins)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${detail.color}22`, color: detail.color }}
                >
                  {detail.kind}
                </span>
                {/* The yellow one is the weekly priority — the same reservation the grid behind
                    this dialog keeps. The daily-priority chip carries a yellow star on neutral
                    ink, so the two are told apart here exactly as they are on a card. */}
                {task.is_weekly_priority && (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                    style={{ backgroundColor: `${WEEKLY_PRIORITY_COLOR}22`, color: WEEKLY_PRIORITY_COLOR }}
                  >
                    Weekly Priority
                  </span>
                )}
                {task.is_daily_priority && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-muted text-muted-foreground">
                    <Star className="w-3 h-3 fill-current" style={{ color: WEEKLY_PRIORITY_COLOR }} />
                    Daily Priority
                  </span>
                )}
              </div>

              {detail.rows.length > 0 && (
                <dl className="rounded-xl bg-muted/50 divide-y divide-border">
                  {detail.rows.map(row => (
                    <div key={row.label} className="flex gap-4 px-4 py-3">
                      <dt className="text-xs font-bold text-muted-foreground w-24 shrink-0 pt-0.5">
                        {row.label}
                      </dt>
                      <dd className="text-sm text-foreground font-serif break-words min-w-0">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="text-sm font-serif flex items-center gap-2">
                {task.is_completed ? (
                  <>
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground">Completed</span>
                  </>
                ) : (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Not completed yet</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
                /* DialogContent renders its own X, so a bare "Close" would give the dialog two
                   controls with the same name — to the e2e suite and to a screen reader alike. */
                aria-label="Close task details"
                className="border-border text-foreground hover:bg-secondary/20"
              >
                Close
              </Button>
              <Button
                onClick={handleToggle}
                disabled={isSaving}
                className={
                  task.is_completed
                    ? "bg-muted text-foreground hover:bg-muted/80"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : task.is_completed ? (
                  <Undo2 className="w-4 h-4 mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {task.is_completed ? "Mark as not done" : "Mark as done"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
