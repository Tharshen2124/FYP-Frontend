"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import type { ModalState } from "../_types"

interface Props {
  modal: ModalState
  onChange: (update: (m: ModalState) => ModalState) => void
  onClose: () => void
  onSave: () => void
}

export function AppointmentModal({ modal, onChange, onClose, onSave }: Props) {
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
              {DAYS_SHORT.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChange(m => ({ ...m, dayIndex: i }))}
                  className={`py-2 rounded-sm text-xs font-bold transition-all ${
                    modal.dayIndex === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
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

          <div className="space-y-1.5">
            <Label htmlFor="appt-description" className="text-foreground font-bold">Description</Label>
            <Textarea
              id="appt-description"
              placeholder="Optional notes about this appointment…"
              value={modal.description}
              onChange={e => onChange(m => ({ ...m, description: e.target.value }))}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground min-h-20 resize-none font-serif"
            />
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
