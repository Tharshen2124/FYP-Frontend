"use client"

import { useState, useRef } from "react"
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
import { ClashWarningModal } from "@/components/clash-warning-modal"
import { ClashBlockModal } from "@/components/clash-block-modal"
import { FixedAppointmentCard } from "./fixed-appointment-card"
import type { Appt, CalItem, ApptModalState, PastDayPolicy, PendingApptAction } from "../_types/calendar"
import { DAYS_FULL, DAYS_SHORT, CAL_START, CAL_END, TOTAL_HRS, HR_PX, EMPTY_APPT_MODAL } from "../_constants/calendar"
import { CalendarDayHeader } from "./calendar-day-header"
import { usePlanWeekDays } from "../_utils/use-plan-week"
import { getOverlaps } from "../_utils/calendar"
import { isPastDayIndex } from "@/lib/date"
import { minsToStr, strToMins, snapMins } from "../_utils/time"

interface Props {
  appts: Appt[]
  setAppts: React.Dispatch<React.SetStateAction<Appt[]>>
  /** The Monday being planned, so the calendar prints that week's dates and not this week's. */
  weekStart: string
  /**
   * Whether the days of this week that have gone are closed to new work. `"block"` is the planning
   * rule; `"open"` is `/weekly-plan/edit`, whose whole job is moving work off a day that is behind.
   */
  pastDays?: PastDayPolicy
}

export function FixedTab({ appts, setAppts, weekStart, pastDays = "block" }: Props) {
  const [modal, setModal]               = useState<ApptModalState>(EMPTY_APPT_MODAL)
  const [pendingAction, setPendingAction] = useState<PendingApptAction | null>(null)
  const [clashWarning, setClashWarning] = useState<{ open: boolean; conflictingTitle: string }>({ open: false, conflictingTitle: "" })
  const [clashBlock, setClashBlock]     = useState(false)

  const dragInfo    = useRef<{ id: string; offsetMins: number } | null>(null)
  const colRefs     = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null))

  const allCalItems: CalItem[] = appts.map(a => ({ id: a.id, dayIndex: a.dayIndex, startMins: a.startMins, endMins: a.endMins }))

  const openAdd = (dayIndex: number, clickY: number) => {
    const raw   = CAL_START * 60 + (clickY / HR_PX) * 60
    const start = Math.max(CAL_START * 60, Math.min((CAL_END - 1) * 60, snapMins(raw)))
    const end   = Math.min(CAL_END * 60, start + 60)
    setModal({ open: true, mode: "add", dayIndex, startTime: minsToStr(start), endTime: minsToStr(end), title: "" })
  }

  const openEdit = (appt: Appt) =>
    setModal({ open: true, mode: "edit", editId: appt.id, dayIndex: appt.dayIndex, startTime: minsToStr(appt.startMins), endTime: minsToStr(appt.endMins), title: appt.title })

  const handleColClick = (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
    if ((e.target as HTMLElement).closest("[data-appt]")) return
    openAdd(dayIndex, e.clientY - e.currentTarget.getBoundingClientRect().top)
  }

  const applySave = (appt: Appt) => {
    setAppts(prev => (prev.some(a => a.id === appt.id) ? prev.map(a => (a.id === appt.id ? appt : a)) : [...prev, appt]))
  }

  const applyDrop = (draggedId: string, dayIndex: number, newStart: number) => {
    setAppts(prev => prev.map(a => {
      if (a.id !== draggedId) return a
      const dur = a.endMins - a.startMins
      return { ...a, dayIndex, startMins: newStart, endMins: newStart + dur }
    }))
  }

  // Adding used to skip the clash check that editing and dragging both ran, so the one way to
  // create an overlap was to create it in the first place. Both paths now build the whole
  // appointment and go through the same check.
  const handleSave = () => {
    const s = strToMins(modal.startTime)
    const e = strToMins(modal.endTime)
    if (!modal.title.trim() || e <= s) return

    const id = modal.mode === "edit" ? modal.editId! : crypto.randomUUID()
    const existing = appts.find(a => a.id === id)
    const appt: Appt = {
      id,
      // Kept so an edit updates the server's row instead of replacing it, which would reset the
      // completion already recorded against it.
      taskId: existing?.taskId,
      title: modal.title.trim(),
      dayIndex: modal.dayIndex,
      startMins: s, endMins: e,
      isCompleted: existing?.isCompleted ?? false,
    }

    const overlapping = getOverlaps(allCalItems, modal.dayIndex, s, e, id)
    if (overlapping.length === 0) {
      applySave(appt)
      setModal(EMPTY_APPT_MODAL)
    } else if (overlapping.length === 1) {
      const conflict = appts.find(a => a.id === overlapping[0].id)
      setPendingAction({ type: "save", appt })
      setClashWarning({ open: true, conflictingTitle: conflict?.title ?? "Unknown" })
    } else {
      setClashBlock(true)
    }
  }

  const onDragStart = (e: React.DragEvent, appt: Appt) => {
    const offsetY = e.clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top
    dragInfo.current = { id: appt.id, offsetMins: Math.round((offsetY / HR_PX) * 60) }
    const ghost = document.createElement("div")
    Object.assign(ghost.style, { position: "fixed", top: "-9999px", width: "1px", height: "1px" })
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    e.dataTransfer.effectAllowed = "move"
    requestAnimationFrame(() => document.body.removeChild(ghost))
  }

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move" }

  const onDrop = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault()
    if (!dragInfo.current) return
    const col = colRefs.current[dayIndex]
    if (!col) return

    const y         = e.clientY - col.getBoundingClientRect().top
    const rawStart  = CAL_START * 60 + (y / HR_PX) * 60 - dragInfo.current.offsetMins
    const draggedId = dragInfo.current.id
    dragInfo.current = null

    const dragged = appts.find(a => a.id === draggedId)
    if (!dragged) return

    const dur      = dragged.endMins - dragged.startMins
    const newStart = Math.max(CAL_START * 60, Math.min(CAL_END * 60 - dur, snapMins(rawStart)))
    const newEnd   = newStart + dur
    const overlapping = getOverlaps(allCalItems, dayIndex, newStart, newEnd, draggedId)

    if (overlapping.length === 0) {
      applyDrop(draggedId, dayIndex, newStart)
    } else if (overlapping.length === 1) {
      const conflict = appts.find(a => a.id === overlapping[0].id)
      setPendingAction({ type: "drop", draggedId, dayIndex, newStart })
      setClashWarning({ open: true, conflictingTitle: conflict?.title ?? "Unknown" })
    } else {
      setClashBlock(true)
    }
  }

  const handleClashProceed = () => {
    if (pendingAction?.type === "drop") {
      applyDrop(pendingAction.draggedId, pendingAction.dayIndex, pendingAction.newStart)
    } else if (pendingAction?.type === "save") {
      applySave(pendingAction.appt)
      setModal(EMPTY_APPT_MODAL)
    }
    setPendingAction(null)
    setClashWarning({ open: false, conflictingTitle: "" })
  }

  const handleClashCancel = () => {
    setPendingAction(null)
    setClashWarning({ open: false, conflictingTitle: "" })
  }

  const week = usePlanWeekDays(weekStart)
  // One value carries the policy to every past-day check below: `null` means nothing is blocked,
  // which is exactly what `isPastDayIndex` already answers for a week that is not the current one.
  const blockedBefore = pastDays === "block" ? week?.todayIdx ?? null : null
  const calH           = TOTAL_HRS * HR_PX
  const endTimeInvalid = strToMins(modal.endTime) <= strToMins(modal.startTime)

  return (
    <>
      <div className="mb-4">
        <p className="text-muted-foreground font-serif">
          Click any time slot to add a recurring commitment. Drag to reschedule.
        </p>
      </div>

      <div className="bg-card border-2 border-border rounded-md overflow-hidden">
        <CalendarDayHeader week={week} pastDays={pastDays} />

        <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
          <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", height: calH }}>
            <div className="relative select-none">
              {Array.from({ length: TOTAL_HRS }, (_, i) => {
                const hour  = i + CAL_START
                const label = hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`
                return (
                  <div key={hour} className="absolute right-2 text-[11px] text-muted-foreground leading-none" style={{ top: i * HR_PX - 7 }}>
                    {label}
                  </div>
                )
              })}
            </div>

            {DAYS_FULL.map((day, di) => {
              // A day that has gone takes nothing new. Withholding the handlers is the whole
              // block: with no `onDragOver` the column never becomes a drop target, so the browser
              // shows the no-drop cursor and `onDrop` is never reached.
              const isPast = isPastDayIndex(blockedBefore, di)
              return (
              <div
                key={day}
                data-day-column={di}
                ref={el => { colRefs.current[di] = el }}
                aria-disabled={isPast || undefined}
                title={isPast ? "This day has passed — nothing new can be scheduled on it" : undefined}
                className={[
                  "relative border-l border-border select-none",
                  isPast ? "bg-foreground/[0.06] cursor-not-allowed" : "cursor-pointer",
                ].join(" ")}
                style={{ height: calH }}
                onClick={isPast ? undefined : e => handleColClick(e, di)}
                onDragOver={isPast ? undefined : onDragOver}
                onDrop={isPast ? undefined : e => onDrop(e, di)}
              >
                {Array.from({ length: TOTAL_HRS }, (_, i) => (
                  <div key={i} className="absolute w-full border-t border-border/50" style={{ top: i * HR_PX }} />
                ))}
                {Array.from({ length: TOTAL_HRS }, (_, i) => (
                  <div key={`h${i}`} className="absolute w-full border-t border-border/20" style={{ top: i * HR_PX + HR_PX / 2 }} />
                ))}

                {appts.filter(a => a.dayIndex === di).map(appt => (
                  <FixedAppointmentCard
                    key={appt.id}
                    appt={appt}
                    allCalItems={allCalItems}
                    onEdit={openEdit}
                    onDelete={id => setAppts(prev => prev.filter(a => a.id !== id))}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
              )
            })}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground font-serif mt-3">
        Drag appointments to move them. Hover an appointment to edit or delete. One you have already
        completed can be moved or renamed, but not removed.
      </p>

      <Dialog open={modal.open} onOpenChange={open => { if (!open) setModal(EMPTY_APPT_MODAL) }}>
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
                onChange={e => setModal(m => ({ ...m, title: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") handleSave() }}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground font-bold">Day</Label>
              <div className="grid grid-cols-7 gap-1">
                {DAYS_SHORT.map((d, i) => {
                  // The day it already sits on stays clickable even when past, so opening an
                  // appointment to rename it is never a one-way trip off its own day.
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
                <Label htmlFor="appt-from" className="text-foreground font-bold">From</Label>
                <Input
                  id="appt-from"
                  type="time"
                  value={modal.startTime}
                  onChange={e => setModal(m => ({ ...m, startTime: e.target.value }))}
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="appt-to" className="text-foreground font-bold">To</Label>
                <Input
                  id="appt-to"
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModal(EMPTY_APPT_MODAL)}
              className="border-border text-foreground hover:bg-secondary/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!modal.title.trim() || endTimeInvalid}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {modal.mode === "add" ? "Add Appointment" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClashWarningModal
        open={clashWarning.open}
        conflictingTitle={clashWarning.conflictingTitle}
        onProceed={handleClashProceed}
        onCancel={handleClashCancel}
      />
      <ClashBlockModal open={clashBlock} onClose={() => setClashBlock(false)} />
    </>
  )
}
