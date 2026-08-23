"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import type { CheckInStatus } from "@/lib/api"
import { MAX_REFLECTION_LENGTH } from "@/lib/reflections"
import { useCurrentWeek } from "@/hooks/use-current-week"
import { useTodayReflection } from "../_utils/use-today-reflection"
import type { CalEvent } from "../_types"

interface Props {
  /** This week's scheduled items; the check-in shows only today's. */
  events: CalEvent[]
  /** Owned by the shell, which needs it to refuse a dismissal mid-save. */
  isSaving: boolean
  onSavingChange: (isSaving: boolean) => void
  onClose: (outcome: CheckInStatus) => void
  onCompletionChange: (changed: { id: string; isCompleted: boolean }[]) => void
}

/**
 * The body of the End-of-Day check-in: today's tasks, tonight's reflection, and the one save that
 * writes both.
 *
 * It is a component of its own because Radix mounts a dialog's contents only while it is open —
 * which makes every opening a fresh mount, and every piece of state here start from what the
 * server currently holds rather than from whatever the last visit left behind.
 */
export function EndOfDayCheckIn({ events, isSaving, onSavingChange, onClose, onCompletionChange }: Props) {
  const week = useCurrentWeek()
  const todayIdx = week?.todayIdx ?? null
  const todayEvents = todayIdx === null ? [] : events.filter(e => e.dayIndex === todayIdx)

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  /* Today's stored reflection, so the check-in edits what `/evening-reflections` already holds
     rather than replacing it — both write the same (week, day) row. */
  const { text, setText, isLoading, loadFailed, reload } = useTodayReflection(todayIdx)

  /* Seeded from what is already stored, so the check-in shows the day as it stands rather than as
     a blank slate — otherwise saving twice would untick everything ticked the first time. */
  useEffect(() => {
    if (todayIdx === null) return
    setCompletedIds(
      new Set(events.filter(e => e.dayIndex === todayIdx && e.isCompleted).map(e => e.id))
    )
  }, [events, todayIdx])

  const toggleCompleted = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const trimmed = text.trim()
  const tooLong = text.length > MAX_REFLECTION_LENGTH
  /* Ticking nothing is a valid answer — a day where nothing got done is still a day worth
     recording — so the reflection is the whole of the gate. */
  const canSave = trimmed.length > 0 && !tooLong && !isLoading && !loadFailed && !isSaving

  /* Only what actually changed is sent. Ticking two of a day's six tasks is two requests, not six,
     and a task already stored as done is left alone. The reflection always goes: it is the thing
     the check-in is really asking for, and it cannot be reached without being written. */
  const handleSave = async () => {
    if (todayIdx === null) return

    const changed = todayEvents
      .filter(event => event.isCompleted !== completedIds.has(event.id))
      .map(event => ({ id: event.id, isCompleted: completedIds.has(event.id) }))

    onSavingChange(true)
    try {
      if (changed.length > 0) {
        await Promise.all(changed.map(({ id, isCompleted }) => api.setTaskCompletion(Number(id), isCompleted)))
        /* Reported before the reflection can throw: if that call fails the ticks are already
           stored, the timetable already agrees, and a retry re-diffs to nothing and sends the
           reflection alone. */
        onCompletionChange(changed)
      }
      await api.saveEveningReflection(todayIdx, trimmed)
      /* Recorded last, and inside the same wait: it is the row that stops every device asking
         again, so it must not be written for a night whose reflection never landed. */
      await api.saveCheckIn(todayIdx, "completed")
      onClose("completed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your check-in — please try again.")
    } finally {
      onSavingChange(false)
    }
  }

  return (
    <>
      <div className="space-y-6 py-2">
        {/* Tasks section */}
        <div>
          <p className="text-sm font-bold text-foreground mb-3">
            Which tasks did you complete today?
          </p>

          {todayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground font-serif px-3 py-4 rounded-xl bg-muted/50">
              {todayIdx === null ? "Loading today…" : "No tasks were scheduled for today."}
            </p>
          ) : (
            <div className="space-y-2">
              {todayEvents.map(event => {
                const isDone = completedIds.has(event.id)
                return (
                  <button
                    key={event.id}
                    onClick={() => toggleCompleted(event.id)}
                    aria-pressed={isDone}
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

          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-8 rounded-xl bg-muted/50 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-serif">Loading today&apos;s reflection…</span>
            </div>
          ) : loadFailed ? (
            /* Never offer a textarea over a row we failed to read — saving it would replace an
               entry we cannot see. */
            <div className="px-3 py-5 rounded-xl bg-muted/50 text-center">
              <p className="text-sm text-foreground font-serif mb-3">
                We couldn&apos;t load today&apos;s reflection.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={reload}
                className="border-border text-foreground hover:bg-secondary/20"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What went well? What challenged you? How did you live your roles today?"
                className="min-h-28 resize-none font-serif bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex items-baseline justify-between gap-3 mt-1">
                <p className="text-xs text-muted-foreground font-serif">
                  {trimmed.length === 0 && "Write a reflection to finish your check-in."}
                </p>
                <p className={`text-xs font-serif shrink-0 ${tooLong ? "text-destructive" : "text-muted-foreground"}`}>
                  {text.length} / {MAX_REFLECTION_LENGTH}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => onClose("skipped")}
          disabled={isSaving}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors font-serif disabled:opacity-50"
        >
          Skip for now
        </button>
        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
        >
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save &amp; Close
        </Button>
      </div>
    </>
  )
}
