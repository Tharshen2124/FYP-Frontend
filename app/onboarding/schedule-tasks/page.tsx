"use client"

import { useState, useRef } from "react"
import { AppNav } from "@/components/app-nav"
import { ClashWarningModal } from "@/components/clash-warning-modal"
import { ClashBlockModal } from "@/components/clash-block-modal"
import { OnboardingStepper } from "@/components/onboarding-stepper"
import { CalendarLegend } from "./_components/calendar-legend"
import { FixedAppointmentCard } from "./_components/fixedAppointmentCard"
import { TaskCard } from "./_components/task-card"
import { TaskModal } from "./_components/task-modal"
import { DAYS_FULL, DAYS_SHORT, CAL_START, CAL_END, TOTAL_HRS, HR_PX, EMPTY_MODAL } from "./_constants/calendar"
import { MOCK_FIXED, MOCK_ROLES, MOCK_DIMENSIONS } from "./_constants/mock-data"
import { getOverlaps } from "./_utils/calendar"
import { minsToStr, strToMins, snapMins } from "./_utils/time"
import { getLinkMeta } from "./_utils/tasks"
import type { Task, ModalState, PendingAction, CalItem, LinkType } from "./_types"

export default function ScheduleTasksPage() {
  const [tasks, setTasks]                = useState<Task[]>([])
  const [modal, setModal]                = useState<ModalState>(EMPTY_MODAL)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [clashWarning, setClashWarning]  = useState<{ open: boolean; conflictingTitle: string }>({ open: false, conflictingTitle: "" })
  const [clashBlock, setClashBlock]      = useState(false)

  const dragInfo = useRef<{ id: string; offsetMins: number } | null>(null)
  const colRefs  = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null))

  const allCalItems: CalItem[] = [
    ...MOCK_FIXED,
    ...tasks.map(t => ({ id: t.id, dayIndex: t.dayIndex, startMins: t.startMins, endMins: t.endMins })),
  ]

  function findTitle(id: string) {
    return tasks.find(t => t.id === id)?.title ?? MOCK_FIXED.find(f => f.id === id)?.title ?? "Unknown"
  }

  // ── open add modal ──
  const openAdd = (dayIndex: number, clickY: number) => {
    const raw   = CAL_START * 60 + (clickY / HR_PX) * 60
    const start = Math.max(CAL_START * 60, Math.min((CAL_END - 1) * 60, snapMins(raw)))
    const end   = Math.min(CAL_END * 60, start + 60)
    setModal({ ...EMPTY_MODAL, open: true, mode: "add", dayIndex, startTime: minsToStr(start), endTime: minsToStr(end) })
  }

  const openEdit = (task: Task) => {
    let selectedRoleId      = MOCK_ROLES[0]?.id ?? ""
    let selectedGoalId      = ""
    let selectedDimensionId = MOCK_DIMENSIONS[0]?.id ?? ""
    let selectedActivityId  = ""

    if (task.linkType === "role-goal") {
      for (const role of MOCK_ROLES) {
        const goal = role.goals.find(g => task.linkLabel.includes(g.text))
        if (goal) { selectedRoleId = role.id; selectedGoalId = goal.id; break }
      }
    } else {
      for (const dim of MOCK_DIMENSIONS) {
        const act = dim.activities.find(a => task.linkLabel.includes(a.text))
        if (act) { selectedDimensionId = dim.id; selectedActivityId = act.id; break }
      }
    }

    setModal({
      open: true, mode: "edit", editId: task.id,
      dayIndex:        task.dayIndex,
      startTime:       minsToStr(task.startMins),
      endTime:         minsToStr(task.endMins),
      title:           task.title,
      linkType:        task.linkType,
      selectedRoleId,
      selectedGoalId,
      selectedDimensionId,
      selectedActivityId,
      isDailyPriority: task.isDailyPriority,
    })
  }

  const handleColClick = (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
    if ((e.target as HTMLElement).closest("[data-task]")) return
    openAdd(dayIndex, e.clientY - e.currentTarget.getBoundingClientRect().top)
  }

  // ── save ──
  const handleSave = () => {
    const s    = strToMins(modal.startTime)
    const e    = strToMins(modal.endTime)
    const meta = getLinkMeta(modal)
    if (!modal.title.trim() || e <= s || !meta) return

    if (modal.mode === "add") {
      setTasks(prev => [...prev, {
        id: Date.now().toString(),
        title: modal.title.trim(),
        dayIndex: modal.dayIndex,
        startMins: s, endMins: e,
        color: meta.color,
        linkType: modal.linkType,
        linkLabel: meta.label,
        isDailyPriority: modal.isDailyPriority,
      }])
      setModal(EMPTY_MODAL)
      return
    }

    const overlapping = getOverlaps(allCalItems, modal.dayIndex, s, e, modal.editId!)
    if (overlapping.length === 0) {
      applyTaskSave(modal.editId!, modal.title.trim(), modal.dayIndex, s, e, meta.color, modal.linkType, meta.label, modal.isDailyPriority)
      setModal(EMPTY_MODAL)
    } else if (overlapping.length === 1) {
      setPendingAction({ type: "save", editId: modal.editId!, title: modal.title.trim(), dayIndex: modal.dayIndex, startMins: s, endMins: e, color: meta.color, linkType: modal.linkType, linkLabel: meta.label, isDailyPriority: modal.isDailyPriority })
      setClashWarning({ open: true, conflictingTitle: findTitle(overlapping[0].id) })
    } else {
      setClashBlock(true)
    }
  }

  // ── apply confirmed actions ──
  const applyDrop = (draggedId: string, dayIndex: number, newStart: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== draggedId) return t
      const dur = t.endMins - t.startMins
      return { ...t, dayIndex, startMins: newStart, endMins: newStart + dur }
    }))
  }

  const applyTaskSave = (editId: string, title: string, dayIndex: number, startMins: number, endMins: number, color: string, linkType: LinkType, linkLabel: string, isDailyPriority: boolean) => {
    setTasks(prev => prev.map(t =>
      t.id === editId ? { ...t, title, dayIndex, startMins, endMins, color, linkType, linkLabel, isDailyPriority } : t
    ))
  }

  // ── drag ──
  const onDragStart = (e: React.DragEvent, task: Task) => {
    const offsetY = e.clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top
    dragInfo.current = { id: task.id, offsetMins: Math.round((offsetY / HR_PX) * 60) }
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
    const draggedId = dragInfo.current.id
    dragInfo.current = null

    const dragged = tasks.find(t => t.id === draggedId)
    if (!dragged) return

    const dur      = dragged.endMins - dragged.startMins
    const newStart = Math.max(CAL_START * 60, Math.min(CAL_END * 60 - dur, snapMins(rawStart)))
    const newEnd   = newStart + dur

    const overlapping = getOverlaps(allCalItems, dayIndex, newStart, newEnd, draggedId)
    if (overlapping.length === 0) {
      applyDrop(draggedId, dayIndex, newStart)
    } else if (overlapping.length === 1) {
      setPendingAction({ type: "drop", draggedId, dayIndex, newStart })
      setClashWarning({ open: true, conflictingTitle: findTitle(overlapping[0].id) })
    } else {
      setClashBlock(true)
    }
  }

  // ── clash handlers ──
  const handleClashProceed = () => {
    if (pendingAction?.type === "drop") {
      applyDrop(pendingAction.draggedId, pendingAction.dayIndex, pendingAction.newStart)
    } else if (pendingAction?.type === "save") {
      applyTaskSave(pendingAction.editId, pendingAction.title, pendingAction.dayIndex, pendingAction.startMins, pendingAction.endMins, pendingAction.color, pendingAction.linkType, pendingAction.linkLabel, pendingAction.isDailyPriority)
      setModal(EMPTY_MODAL)
    }
    setPendingAction(null)
    setClashWarning({ open: false, conflictingTitle: "" })
  }

  const handleClashCancel = () => {
    setPendingAction(null)
    setClashWarning({ open: false, conflictingTitle: "" })
  }

  const calH = TOTAL_HRS * HR_PX

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" nextHref="/onboarding/complete" nextEnabled={tasks.length > 0} />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <OnboardingStepper currentStep={4} />

          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Schedule <span className="text-primary">Tasks</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Block time for your goals and renewal activities. Click any slot to add a task.
            </p>
          </div>

          <CalendarLegend />

          {/* ── Calendar ── */}
          <div className="bg-card border-2 border-border rounded-md overflow-hidden">
            <div className="grid border-b border-border" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div />
              {DAYS_SHORT.map(d => (
                <div key={d} className="py-3 text-center border-l border-border">
                  <span className="text-sm font-bold text-foreground">{d}</span>
                </div>
              ))}
            </div>

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
                    {Array.from({ length: TOTAL_HRS }, (_, i) => (
                      <div key={i}       className="absolute w-full border-t border-border/50" style={{ top: i * HR_PX }} />
                    ))}
                    {Array.from({ length: TOTAL_HRS }, (_, i) => (
                      <div key={`h${i}`} className="absolute w-full border-t border-border/20" style={{ top: i * HR_PX + HR_PX / 2 }} />
                    ))}

                    {MOCK_FIXED.filter(f => f.dayIndex === di).map(appt => (
                      <FixedAppointmentCard key={appt.id} appt={appt} allCalItems={allCalItems} />
                    ))}

                    {tasks.filter(t => t.dayIndex === di).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        allCalItems={allCalItems}
                        onEdit={openEdit}
                        onDelete={id => setTasks(prev => prev.filter(t => t.id !== id))}
                        onDragStart={onDragStart}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground font-serif mt-3">
            Drag tasks to move them. Hover a task to edit or delete. Fixed appointments cannot be moved here.
          </p>
        </div>
      </main>

      <TaskModal modal={modal} setModal={setModal} onSave={handleSave} />

      <ClashWarningModal
        open={clashWarning.open}
        conflictingTitle={clashWarning.conflictingTitle}
        onProceed={handleClashProceed}
        onCancel={handleClashCancel}
      />
      <ClashBlockModal open={clashBlock} onClose={() => setClashBlock(false)} />
    </div>
  )
}
