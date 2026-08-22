"use client"

import { useState } from "react"
import { Moon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { EndOfDayCheckIn } from "./end-of-day-check-in"
import type { CheckInStatus } from "@/lib/api"
import type { CalEvent } from "../_types"

interface Props {
  open: boolean
  /** How the night ended, which is what gets recorded so no device asks again. */
  onClose: (outcome: CheckInStatus) => void
  /** This week's scheduled items; the check-in shows only today's. */
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

/**
 * The shell of the nightly check-in. Everything with state lives in `EndOfDayCheckIn`, which the
 * dialog mounts only while it is open — so the save button and the busy flag it owns cannot leave
 * the dialog stuck once it has been dismissed.
 */
export function EndOfDayModal({ open, onClose, events, onCompletionChange }: Props) {
  const [isSaving, setIsSaving] = useState(false)

  return (
    <Dialog open={open} onOpenChange={next => { if (!next && !isSaving) onClose("skipped") }}>
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

        <EndOfDayCheckIn
          events={events}
          isSaving={isSaving}
          onSavingChange={setIsSaving}
          onClose={onClose}
          onCompletionChange={onCompletionChange}
        />
      </DialogContent>
    </Dialog>
  )
}
