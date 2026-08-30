"use client"

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
import { DAYS_SHORT } from "../_constants/calendar"
import { strToMins } from "../_utils/time"
import { isPastDayIndex } from "@/lib/date"
import type { ModalState } from "../_types"

interface Props {
  modal: ModalState
  onChange: (update: (m: ModalState) => ModalState) => void
  onClose: () => void
  onSave: () => void
  /** Today's column, so the day picker refuses the days the calendar has already blocked off. */
  todayIdx: number | null
}

export function AppointmentModal({ modal, onChange, onClose, onSave, todayIdx }: Props) {
  const endTimeInvalid = strToMins(modal.endTime) <= strToMins(modal.startTime)

  return (
    <Dialog open={modal.open} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {modal.mode === "add" ? "Add Fixed Appointment" : "Edit Appointment"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-serif">
            {modal.mode === "add"
              ? "Block out a recurring commitment in your weekly schedule."
              : "Update the details of this appointment."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="appt-title" className="text-foreground font-bold">Appointment</Label>
            <Input
              id="appt-title"
              autoFocus
              placeholder="e.g., Morning workout, Team standup…"
              value={modal.title}
              onChange={e => onChange(m => ({ ...m, title: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") onSave() }}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground font-bold">Day</Label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_SHORT.map((d, i) => {
                // The day it already sits on stays clickable even when past, so opening an
                // appointment to rename it is never a one-way trip off its own day.
                const blocked = isPastDayIndex(todayIdx, i) && modal.dayIndex !== i
                return (
                <button
                  key={d}
                  type="button"
                  disabled={blocked}
                  title={blocked ? "This day has passed" : undefined}
                  onClick={() => onChange(m => ({ ...m, dayIndex: i }))}
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
              <Label htmlFor="appt-from" className="text-foreground font-bold">From</Label>
              <Input
                id="appt-from"
                type="time"
                value={modal.startTime}
                onChange={e => onChange(m => ({ ...m, startTime: e.target.value }))}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-to" className="text-foreground font-bold">To</Label>
              <Input
                id="appt-to"
                type="time"
                value={modal.endTime}
                onChange={e => onChange(m => ({ ...m, endTime: e.target.value }))}
                className="bg-muted border-border text-foreground"
              />
              {endTimeInvalid && modal.endTime && (
                <p className="text-xs text-destructive font-serif">Must be after start time</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border text-foreground hover:bg-secondary/20">
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!modal.title.trim() || endTimeInvalid}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {modal.mode === "add" ? "Add Appointment" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
