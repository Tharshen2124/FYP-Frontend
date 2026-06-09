"use client"

import { useState, useRef } from "react"
import { Pencil, X } from "lucide-react"
import { AppNav } from "@/components/app-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { OnboardingStepper } from "@/components/onboarding-stepper"

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_FULL  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const CAL_START = 6    // 6 AM
const CAL_END   = 22   // 10 PM
const TOTAL_HRS = CAL_END - CAL_START
const HR_PX     = 64   // pixels per hour  →  1 min = HR_PX/60 px

const COLORS = ["#B13BFF", "#FFCC00", "#14b8a6", "#f97316", "#f43f5e", "#3b82f6", "#22c55e", "#471396"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minsToStr(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`
}

function strToMins(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + (m || 0)
}

function fmtTime(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
}

function snapMins(mins: number) {
  return Math.round(mins / 15) * 15
}

/** Returns the overlapping appointments for a given time range on a given day. */
function getOverlaps(all: Appt[], dayIndex: number, startMins: number, endMins: number, excludeId: string) {
  return all.filter(
    a => a.id !== excludeId &&
         a.dayIndex === dayIndex &&
         a.startMins < endMins &&
         a.endMins   > startMins
  )
}

/**
 * Returns inline style overrides for an appointment card.
 * When 2 events overlap, they split the column 50/50 (Google Calendar style).
 * Sort order: earlier startMins goes left; ties broken by id for stability.
 */
function getApptPositionStyle(appt: Appt, allAppts: Appt[]): React.CSSProperties {
  const overlapping = getOverlaps(allAppts, appt.dayIndex, appt.startMins, appt.endMins, appt.id)

  if (overlapping.length === 0) {
    return { left: "2px", right: "2px", width: "auto" }
  }

  const group = [appt, ...overlapping].sort(
    (a, b) => a.startMins - b.startMins || a.id.localeCompare(b.id)
  )
  const col = group.findIndex(a => a.id === appt.id)

  return col === 0
    ? { left: "2px",              width: "calc(50% - 3px)", right: "auto" }
    : { left: "calc(50% + 1px)", width: "calc(50% - 3px)", right: "auto" }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Appt {
  id: string
  title: string
  description: string
  dayIndex: number
  startMins: number
  endMins: number
  color: string
}

interface ModalState {
  open: boolean
  mode: "add" | "edit"
  editId?: string
  dayIndex: number
  startTime: string
  endTime: string
  title: string
  description: string
}

type PendingAction =
  | { type: "drop"; draggedId: string; dayIndex: number; newStart: number }
  | { type: "save"; editId: string; title: string; description: string; dayIndex: number; startMins: number; endMins: number }

const EMPTY_MODAL: ModalState = {
  open: false,
  mode: "add",
  dayIndex: 0,
  startTime: "09:00",
  endTime: "10:00",
  title: "",
  description: "",
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FixedAppointmentsPage() {
  const [appts, setAppts]               = useState<Appt[]>([])
  const [modal, setModal]               = useState<ModalState>(EMPTY_MODAL)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [clashWarning, setClashWarning] = useState<{ open: boolean; conflictingTitle: string }>({ open: false, conflictingTitle: "" })
  const [clashBlock, setClashBlock]     = useState(false)
  const colorCursor                     = useRef(0)
  const dragInfo                        = useRef<{ id: string; offsetMins: number } | null>(null)
  const colRefs                         = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null))

  // ── colour cycling ──
  const nextColor = () => COLORS[colorCursor.current++ % COLORS.length]

  // ── open add modal from click on empty slot ──
  const openAdd = (dayIndex: number, clickY: number) => {
    const raw   = CAL_START * 60 + (clickY / HR_PX) * 60
    const start = Math.max(CAL_START * 60, Math.min((CAL_END - 1) * 60, snapMins(raw)))
    const end   = Math.min(CAL_END * 60, start + 60)
    setModal({ open: true, mode: "add", dayIndex, startTime: minsToStr(start), endTime: minsToStr(end), title: "", description: "" })
  }

  const openEdit = (appt: Appt) =>
    setModal({
      open: true, mode: "edit", editId: appt.id,
      dayIndex:  appt.dayIndex,
      startTime: minsToStr(appt.startMins),
      endTime:   minsToStr(appt.endMins),
      title:       appt.title,
      description: appt.description,
    })

  const handleColClick = (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
    if ((e.target as HTMLElement).closest("[data-appt]")) return
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    openAdd(dayIndex, y)
  }

  // ── save ──
  const handleSave = () => {
    const s = strToMins(modal.startTime)
    const e = strToMins(modal.endTime)
    if (!modal.title.trim() || e <= s) return

    if (modal.mode === "add") {
      setAppts(prev => [...prev, {
        id: Date.now().toString(),
        title:       modal.title.trim(),
        description: modal.description.trim(),
        dayIndex:    modal.dayIndex,
        startMins: s, endMins: e,
        color: nextColor(),
      }])
      setModal(EMPTY_MODAL)
    } else {
      const overlapping = getOverlaps(appts, modal.dayIndex, s, e, modal.editId!)
      if (overlapping.length === 0) {
        applySave(modal.editId!, modal.title.trim(), modal.description.trim(), modal.dayIndex, s, e)
        setModal(EMPTY_MODAL)
      } else if (overlapping.length === 1) {
        setPendingAction({ type: "save", editId: modal.editId!, title: modal.title.trim(), description: modal.description.trim(), dayIndex: modal.dayIndex, startMins: s, endMins: e })
        setClashWarning({ open: true, conflictingTitle: overlapping[0].title })
        // keep modal open — it closes only on proceed or cancel
      } else {
        setClashBlock(true)
      }
    }
  }

  // ── apply a confirmed drop ──
  const applyDrop = (draggedId: string, dayIndex: number, newStart: number) => {
    setAppts(prev => prev.map(a => {
      if (a.id !== draggedId) return a
      const dur = a.endMins - a.startMins
      return { ...a, dayIndex, startMins: newStart, endMins: newStart + dur }
    }))
  }

  // ── apply a confirmed edit save ──
  const applySave = (editId: string, title: string, description: string, dayIndex: number, startMins: number, endMins: number) => {
    setAppts(prev => prev.map(a =>
      a.id === editId ? { ...a, title, description, dayIndex, startMins, endMins } : a
    ))
  }

  // ── drag ──
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

    const y        = e.clientY - col.getBoundingClientRect().top
    const rawStart = CAL_START * 60 + (y / HR_PX) * 60 - dragInfo.current.offsetMins
    const snapped  = snapMins(rawStart)

    const draggedId = dragInfo.current.id
    dragInfo.current = null

    const dragged = appts.find(a => a.id === draggedId)
    if (!dragged) return

    const dur      = dragged.endMins - dragged.startMins
    const newStart = Math.max(CAL_START * 60, Math.min(CAL_END * 60 - dur, snapped))
    const newEnd   = newStart + dur

    const overlapping = getOverlaps(appts, dayIndex, newStart, newEnd, draggedId)

    if (overlapping.length === 0) {
      applyDrop(draggedId, dayIndex, newStart)
    } else if (overlapping.length === 1) {
      setPendingAction({ type: "drop", draggedId, dayIndex, newStart })
      setClashWarning({ open: true, conflictingTitle: overlapping[0].title })
    } else {
      setClashBlock(true)
    }
  }

  // ── clash modal handlers ──
  const handleClashProceed = () => {
    if (pendingAction?.type === "drop") {
      applyDrop(pendingAction.draggedId, pendingAction.dayIndex, pendingAction.newStart)
    } else if (pendingAction?.type === "save") {
      applySave(pendingAction.editId, pendingAction.title, pendingAction.description, pendingAction.dayIndex, pendingAction.startMins, pendingAction.endMins)
      setModal(EMPTY_MODAL)
    }
    setPendingAction(null)
    setClashWarning({ open: false, conflictingTitle: "" })
  }

  const handleClashCancel = () => {
    setPendingAction(null)
    setClashWarning({ open: false, conflictingTitle: "" })
  }

  // ── derived ──
  const canProceed     = appts.length > 0
  const calH           = TOTAL_HRS * HR_PX
  const endTimeInvalid = strToMins(modal.endTime) <= strToMins(modal.startTime)

  return (
    <div className="min-h-screen bg-background">
      {/* bg blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" nextHref="/onboarding/schedule-tasks" nextEnabled={canProceed} />

      {/* main */}
      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <OnboardingStepper currentStep={3} />

          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Fixed <span className="text-primary">Appointments</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Click any time slot to add a recurring commitment. Drag to reschedule.
            </p>
          </div>

          {/* ── Calendar ── */}
          <div className="bg-card border-2 border-border rounded-md overflow-hidden">
            {/* day header row */}
            <div className="grid border-b border-border" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div />
              {DAYS_SHORT.map(d => (
                <div key={d} className="py-3 text-center border-l border-border">
                  <span className="text-sm font-bold text-foreground">{d}</span>
                </div>
              ))}
            </div>

            {/* scrollable body */}
            <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
              <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", height: calH }}>

                {/* time gutter */}
                <div className="relative select-none">
                  {Array.from({ length: TOTAL_HRS }, (_, i) => {
                    const hour  = i + CAL_START
                    const label = hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`
                    return (
                      <div
                        key={hour}
                        className="absolute right-2 text-[11px] text-muted-foreground leading-none"
                        style={{ top: i * HR_PX - 7 }}
                      >
                        {label}
                      </div>
                    )
                  })}
                </div>

                {/* day columns */}
                {DAYS_FULL.map((day, di) => (
                  <div
                    key={day}
                    ref={el => { colRefs.current[di] = el }}
                    className="relative border-l border-border cursor-pointer select-none"
                    style={{ height: calH }}
                    onClick={e => handleColClick(e, di)}
                    onDragOver={onDragOver}
                    onDrop={e => onDrop(e, di)}
                  >
                    {/* hour lines */}
                    {Array.from({ length: TOTAL_HRS }, (_, i) => (
                      <div key={i}       className="absolute w-full border-t border-border/50" style={{ top: i * HR_PX }} />
                    ))}
                    {/* half-hour lines */}
                    {Array.from({ length: TOTAL_HRS }, (_, i) => (
                      <div key={`h${i}`} className="absolute w-full border-t border-border/20" style={{ top: i * HR_PX + HR_PX / 2 }} />
                    ))}

                    {/* appointments */}
                    {appts.filter(a => a.dayIndex === di).map(appt => {
                      const top    = (appt.startMins - CAL_START * 60) * (HR_PX / 60)
                      const height = Math.max((appt.endMins - appt.startMins) * (HR_PX / 60), 22)
                      const posStyle = getApptPositionStyle(appt, appts)
                      return (
                        <div
                          key={appt.id}
                          data-appt
                          draggable
                          onDragStart={e => onDragStart(e, appt)}
                          onClick={e => e.stopPropagation()}
                          className="absolute rounded-[5px] px-2 py-0.5 cursor-grab active:cursor-grabbing overflow-hidden group"
                          style={{
                            top,
                            height,
                            backgroundColor: `${appt.color}25`,
                            borderLeft: `3px solid ${appt.color}`,
                            ...posStyle,
                          }}
                        >
                          <p className="text-xs font-bold truncate leading-tight" style={{ color: appt.color }}>
                            {appt.title}
                          </p>
                          {height >= 42 && (
                            <p className="text-[10px] text-muted-foreground leading-tight truncate">
                              {fmtTime(appt.startMins)} – {fmtTime(appt.endMins)}
                            </p>
                          )}
                          {height >= 56 && appt.description && (
                            <p className="text-[10px] text-muted-foreground font-serif leading-tight truncate mt-0.5">
                              {appt.description}
                            </p>
                          )}

                          {/* edit / delete */}
                          <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5 z-10">
                            <button
                              onClick={e => { e.stopPropagation(); openEdit(appt) }}
                              className="p-1 rounded bg-card/90 hover:bg-card transition-colors"
                            >
                              <Pencil className="w-2.5 h-2.5" style={{ color: appt.color }} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setAppts(prev => prev.filter(a => a.id !== appt.id)) }}
                              className="p-1 rounded bg-card/90 hover:bg-card transition-colors"
                            >
                              <X className="w-2.5 h-2.5 text-destructive" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground font-serif mt-3">
            Drag appointments to move them. Hover an appointment to edit or delete.
          </p>
        </div>
      </main>

      {/* ── Add / Edit Modal ── */}
      <Dialog open={modal.open} onOpenChange={open => { if (!open) setModal(EMPTY_MODAL) }}>
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
              <Label className="text-foreground font-bold">Appointment</Label>
              <Input
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
                {DAYS_SHORT.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setModal(m => ({ ...m, dayIndex: i }))}
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

            <div className="space-y-1.5">
              <Label className="text-foreground font-bold">Description</Label>
              <Textarea
                placeholder="Optional notes about this appointment…"
                value={modal.description}
                onChange={e => setModal(m => ({ ...m, description: e.target.value }))}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground min-h-20 resize-none font-serif"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModal(EMPTY_MODAL)}
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

      {/* ── Clash modals ── */}
      <ClashWarningModal
        open={clashWarning.open}
        conflictingTitle={clashWarning.conflictingTitle}
        onProceed={handleClashProceed}
        onCancel={handleClashCancel}
      />
      <ClashBlockModal
        open={clashBlock}
        onClose={() => setClashBlock(false)}
      />
    </div>
  )
}
