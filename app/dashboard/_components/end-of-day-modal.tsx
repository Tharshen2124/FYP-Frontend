"use client"

import { useState } from "react"
import { Check, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { MOCK_EVENTS } from "../_constants/mock-data"

interface Props {
  open: boolean
  onClose: () => void
}

function getTodayIndex() {
  return (new Date().getDay() + 6) % 7 // 0=Mon … 6=Sun
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function EndOfDayModal({ open, onClose }: Props) {
  const todayIndex = getTodayIndex()
  const todayEvents = MOCK_EVENTS.filter(e => e.dayIndex === todayIndex)

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [reflection, setReflection] = useState("")

  const toggleCompleted = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSave = () => {
    setCompletedIds(new Set())
    setReflection("")
    onClose()
  }

  const handleSkip = () => {
    setCompletedIds(new Set())
    setReflection("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleSkip() }}>
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
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-serif"
          >
            Skip for now
          </button>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Save &amp; Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
