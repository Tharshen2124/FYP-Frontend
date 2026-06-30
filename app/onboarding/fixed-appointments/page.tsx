"use client"

import { useState, useRef } from "react"
import { AppNav } from "@/components/app-nav"
import { ClashWarningModal } from "@/components/clash-warning-modal"
import { ClashBlockModal } from "@/components/clash-block-modal"
import { OnboardingStepper } from "@/components/onboarding-stepper"
import { DAYS_FULL, DAYS_SHORT, CAL_START, CAL_END, TOTAL_HRS, HR_PX, COLORS, EMPTY_MODAL } from "./_constants/calendar"
import { minsToStr, strToMins, snapMins } from "./_utils/time"
import { getOverlaps } from "./_utils/calendar"
import { type Appt, type ModalState, type PendingAction } from "./_types"
import { AppointmentCard } from "./_components/appointment-card"
import { AppointmentModal } from "./_components/appointment-modal"

export default function FixedAppointmentsPage() {
  const [appts, setAppts]               = useState<Appt[]>([])
  const [modal, setModal]               = useState<ModalState>(EMPTY_MODAL)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [clashWarning, setClashWarning] = useState<{ open: boolean; conflictingTitle: string }>({ open: false, conflictingTitle: "" })
  const [clashBlock, setClashBlock]     = useState(false)
  const colorCursor                     = useRef(0)
  const dragInfo                        = useRef<{ id: string; offsetMins: number } | null>(null)
  const colRefs                         = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null))

  const nextColor = () => COLORS[colorCursor.current++ % COLORS.length]

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

  const applySave = (editId: string, title: string, description: string, dayIndex: number, startMins: number, endMins: number) => {
    setAppts(prev => prev.map(a =>
      a.id === editId ? { ...a, title, description, dayIndex, startMins, endMins } : a
    ))
  }

  const applyDrop = (draggedId: string, dayIndex: number, newStart: number) => {
    setAppts(prev => prev.map(a => {
      if (a.id !== draggedId) return a
      const dur = a.endMins - a.startMins
      return { ...a, dayIndex, startMins: newStart, endMins: newStart + dur }
    }))
  }

  const handleSave = () => {
    const s = strToMins(modal.startTime)
    const e = strToMins(modal.endTime)
    if (!modal.title.trim() || e <= s) return

    if (modal.mode === "add") {
      setAppts(prev => [...prev, {
        id: Date.now().toString(),
        title: modal.title.trim(),
        description: modal.description.trim(),
        dayIndex: modal.dayIndex,
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
      } else {
        setClashBlock(true)
      }
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

  const canProceed = appts.length > 0
  const calH       = TOTAL_HRS * HR_PX

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" nextHref="/onboarding/schedule-tasks" nextEnabled={canProceed} />

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

          <div className="bg-card border-2 border-border rounded-md overflow-hidden">
            {/* Day header row */}
            <div className="grid border-b border-border" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div />
              {DAYS_SHORT.map(d => (
                <div key={d} className="py-3 text-center border-l border-border">
                  <span className="text-sm font-bold text-foreground">{d}</span>
                </div>
              ))}
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
              <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", height: calH }}>
                {/* Time gutter */}
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

                {/* Day columns */}
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
                    {Array.from({ length: TOTAL_HRS }, (_, i) => (
                      <div key={i}       className="absolute w-full border-t border-border/50" style={{ top: i * HR_PX }} />
                    ))}
                    {Array.from({ length: TOTAL_HRS }, (_, i) => (
                      <div key={`h${i}`} className="absolute w-full border-t border-border/20" style={{ top: i * HR_PX + HR_PX / 2 }} />
                    ))}

                    {appts.filter(a => a.dayIndex === di).map(appt => (
                      <AppointmentCard
                        key={appt.id}
                        appt={appt}
                        allAppts={appts}
                        onEdit={openEdit}
                        onDelete={id => setAppts(prev => prev.filter(a => a.id !== id))}
                        onDragStart={onDragStart}
                      />
                    ))}
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

      <AppointmentModal
        modal={modal}
        onChange={setModal}
        onSave={handleSave}
        onClose={() => setModal(EMPTY_MODAL)}
      />

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
