"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppNav } from "@/components/app-nav"
import { ClashWarningModal } from "@/components/clash-warning-modal"
import { ClashBlockModal } from "@/components/clash-block-modal"
import { OnboardingStepper } from "@/components/onboarding-stepper"
import { PastDaysNotice } from "@/components/past-days-notice"
import { useCurrentWeek } from "@/hooks/use-current-week"
import { api } from "@/lib/api"
import { CAL_END, CAL_START, EMPTY_MODAL, HR_PX } from "./_constants/calendar"
import { getOverlaps } from "./_utils/calendar"
import { minsToStr, snapMins, strToMins } from "./_utils/time"
import { toFixedAppointmentsPayload } from "./_utils/appointments"
import { WeekCalendar } from "./_components/week-calendar"
import { AppointmentModal } from "./_components/appointment-modal"
import type { Appt, ModalState, PendingAction } from "./_types"

export default function FixedAppointmentsPage() {
  const router = useRouter()
  const week = useCurrentWeek()
  const [appts, setAppts]                 = useState<Appt[]>([])
  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [modal, setModal]                 = useState<ModalState>(EMPTY_MODAL)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [clashWarning, setClashWarning]   = useState<{ open: boolean; conflictingTitle: string }>({ open: false, conflictingTitle: "" })
  const [clashBlock, setClashBlock]       = useState(false)

  const dragInfo    = useRef<{ id: string; offsetMins: number } | null>(null)
  const colRefs     = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null))

  // ── open add modal from click on empty slot ──
  const openAdd = (dayIndex: number, clickY: number) => {
    const raw   = CAL_START * 60 + (clickY / HR_PX) * 60
    const start = Math.max(CAL_START * 60, Math.min((CAL_END - 1) * 60, snapMins(raw)))
    const end   = Math.min(CAL_END * 60, start + 60)
    setModal({ open: true, mode: "add", dayIndex, startTime: minsToStr(start), endTime: minsToStr(end), title: "" })
  }

  const openEdit = (appt: Appt) =>
    setModal({
      open: true, mode: "edit", editId: appt.id,
      dayIndex:  appt.dayIndex,
      startTime: minsToStr(appt.startMins),
      endTime:   minsToStr(appt.endMins),
      title:     appt.title,
    })

  const handleColClick = (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
    if ((e.target as HTMLElement).closest("[data-appt]")) return
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    openAdd(dayIndex, y)
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
  const applySave = (editId: string, title: string, dayIndex: number, startMins: number, endMins: number) => {
    setAppts(prev => prev.map(a =>
      a.id === editId ? { ...a, title, dayIndex, startMins, endMins } : a
    ))
  }

  const handleSave = () => {
    const s = strToMins(modal.startTime)
    const e = strToMins(modal.endTime)
    if (!modal.title.trim() || e <= s) return

    if (modal.mode === "add") {
      setAppts(prev => [...prev, {
        id: Date.now().toString(),
        title:    modal.title.trim(),
        dayIndex: modal.dayIndex,
        startMins: s, endMins: e,
      }])
      setModal(EMPTY_MODAL)
      return
    }

    const overlapping = getOverlaps(appts, modal.dayIndex, s, e, modal.editId!)
    if (overlapping.length === 0) {
      applySave(modal.editId!, modal.title.trim(), modal.dayIndex, s, e)
      setModal(EMPTY_MODAL)
    } else if (overlapping.length === 1) {
      setPendingAction({ type: "save", editId: modal.editId!, title: modal.title.trim(), dayIndex: modal.dayIndex, startMins: s, endMins: e })
      setClashWarning({ open: true, conflictingTitle: overlapping[0].title })
      // keep modal open — it closes only on proceed or cancel
    } else {
      setClashBlock(true)
    }
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
      applySave(pendingAction.editId, pendingAction.title, pendingAction.dayIndex, pendingAction.startMins, pendingAction.endMins)
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

  const handleNext = async () => {
    setIsSubmitting(true)
    try {
      await api.submitFixedAppointments(toFixedAppointmentsPayload(appts))
      router.push("/onboarding/schedule-tasks")
    } catch {
      toast.error("Couldn't save your appointments — please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* bg blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" onNext={handleNext} nextEnabled={canProceed && !isSubmitting} />

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

          <PastDaysNotice todayIdx={week?.todayIdx ?? null} creates="appointments" />

          <WeekCalendar
            appts={appts}
            colRefs={colRefs}
            onSlotClick={handleColClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onEditAppt={openEdit}
            onDeleteAppt={id => setAppts(prev => prev.filter(a => a.id !== id))}
            onDragStart={onDragStart}
          />

          <p className="text-sm text-muted-foreground font-serif mt-3">
            Drag appointments to move them. Hover an appointment to edit or delete.
          </p>
        </div>
      </main>

      <AppointmentModal
        modal={modal}
        onChange={setModal}
        onClose={() => setModal(EMPTY_MODAL)}
        onSave={handleSave}
        todayIdx={week?.todayIdx ?? null}
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
