"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Moon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { useCurrentWeek } from "@/hooks/use-current-week"
import type { CalEvent } from "../_types"

interface Props {
  open: boolean
  onClose: () => void
  /** This week's scheduled items; the modal shows only today's. */
  events: CalEvent[]
  /** Reports back which task ids ended up ticked, so the timetable behind the modal agrees with it
   *  without refetching the week. */
  onCompletionChange: (changed: { id: string; isCompleted: boolean }[]) => void
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function EndOfDayModal({ open, onClose, events, onCompletionChange }: Props) {
  const week = useCurrentWeek()
  const todayEvents = week ? events.filter(e => e.dayIndex === week.todayIdx) : []

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [reflection, setReflection] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  /* Seeded from what is already stored, so re-opening the check-in shows the day as it stands
     rather than as a blank slate — otherwise saving twice would untick everything ticked the first
     time. Keyed on `open` so a mid-evening reopen picks up the current state. */
  useEffect(() => {
    if (!open) return
    setCompletedIds(new Set(events.filter(e => e.isCompleted).map(e => e.id)))
  }, [open, events])

  const toggleCompleted = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const reset = () => {
    setCompletedIds(new Set())
    setReflection("")
  }

  /* Only what actually changed is sent. Ticking two of a day's six tasks is two requests, not six,
     and a task already stored as done is left alone. */
  const handleSave = async () => {
    const changed = todayEvents
      .filter(event => event.isCompleted !== completedIds.has(event.id))
      .map(event => ({ id: event.id, isCompleted: completedIds.has(event.id) }))

    if (changed.length === 0) {
      reset()
      onClose()
      return
    }

    setIsSaving(true)
    try {
      await Promise.all(changed.map(({ id, isCompleted }) => api.setTaskCompletion(Number(id), isCompleted)))
      onCompletionChange(changed)
      reset()
      onClose()
    } catch {
      toast.error("Couldn't save your tasks — please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open && !isSaving) handleSkip() }}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground leading-tight">
                End of Day
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground font-serif">
                {formatDate(new Date())}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Tasks section */}
          <div>
            <p className="text-sm font-bold text-foreground mb-3">
              Which tasks did you complete today?
            </p>

            {todayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground font-serif px-3 py-4 rounded-xl bg-muted/50">
                No tasks were scheduled for today.
              </p>
            ) : (
              <div className="space-y-2">
                {todayEvents.map(event => {
                  const isDone = completedIds.has(event.id)
                  return (
                    <button
                      key={event.id}
                      onClick={() => toggleCompleted(event.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 text-left transition-all ${
                        isDone
                          ? "bg-primary/10 border-primary"
                          : "bg-muted border-border hover:border-primary/30"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isDone ? "bg-primary border-primary" : "border-muted-foreground"
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                        <span className={`text-sm font-serif truncate transition-colors ${isDone ? "text-foreground line-through opacity-60" : "text-foreground"}`}>
                          {event.title}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Reflection section */}
          <div>
            <p className="text-sm font-bold text-foreground mb-2">Evening Reflection</p>
            <Textarea
              placeholder="What went well? What challenged you? How did you live your roles today?"
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              className="min-h-28 resize-none font-serif bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleSkip}
            disabled={isSaving}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-serif disabled:opacity-50"
          >
            Skip for now
          </button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save &amp; Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
