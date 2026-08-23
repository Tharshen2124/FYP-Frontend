"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AppNav } from "@/components/app-nav"
import { ClashWarningModal } from "@/components/clash-warning-modal"
import { ClashBlockModal } from "@/components/clash-block-modal"
import { OnboardingStepper } from "@/components/onboarding-stepper"
import { PastDaysNotice } from "@/components/past-days-notice"
import { useCurrentWeek } from "@/hooks/use-current-week"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { CalendarLegend } from "./_components/calendar-legend"
import { WeekCalendar } from "./_components/week-calendar"
import { TaskModal } from "./_components/task-modal"
import { CAL_START, CAL_END, HR_PX, EMPTY_MODAL } from "./_constants/calendar"
import { getOverlaps } from "./_utils/calendar"
import { minsToStr, strToMins, snapMins } from "./_utils/time"
import { getLinkMeta, toEditModalState } from "./_utils/tasks"
import { useScheduleTasks } from "./_utils/use-schedule-tasks"
import type { CalItem, ModalState, PendingAction, Task } from "./_types"

export default function ScheduleTasksPage() {
  const router = useRouter()
  const week = useCurrentWeek()

  const {
    fixedAppts, roles, activitiesByDimension, tasks, setTasks,
    isLoading, loadError, isSubmitting, reload, submit,
  } = useScheduleTasks()

  const [modal, setModal]                = useState<ModalState>(EMPTY_MODAL)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [clashWarning, setClashWarning]  = useState<{ open: boolean; conflictingTitle: string }>({ open: false, conflictingTitle: "" })
  const [clashBlock, setClashBlock]      = useState(false)

  const dragInfo = useRef<{ id: string; offsetMins: number } | null>(null)
  const colRefs  = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null))

  const allCalItems: CalItem[] = [
    ...fixedAppts,
    ...tasks.map(t => ({ id: t.id, dayIndex: t.dayIndex, startMins: t.startMins, endMins: t.endMins })),
  ]

  function findTitle(id: string) {
    return tasks.find(t => t.id === id)?.title ?? fixedAppts.find(f => f.id === id)?.title ?? "Unknown"
  }

  // ── open add modal ──
  const openAdd = (dayIndex: number, clickY: number) => {
    const raw   = CAL_START * 60 + (clickY / HR_PX) * 60
    const start = Math.max(CAL_START * 60, Math.min((CAL_END - 1) * 60, snapMins(raw)))
    const end   = Math.min(CAL_END * 60, start + 60)
    setModal({ ...EMPTY_MODAL, open: true, mode: "add", dayIndex, startTime: minsToStr(start), endTime: minsToStr(end) })
  }

  const openEdit = (task: Task) => {
    setModal(toEditModalState(task, roles, activitiesByDimension))
  }

  const handleColClick = (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
    if ((e.target as HTMLElement).closest("[data-task]")) return
    openAdd(dayIndex, e.clientY - e.currentTarget.getBoundingClientRect().top)
  }

  // ── apply confirmed actions ──
  const applyDrop = (draggedId: string, dayIndex: number, newStart: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== draggedId) return t
      const dur = t.endMins - t.startMins
      return { ...t, dayIndex, startMins: newStart, endMins: newStart + dur }
    }))
  }

  const applyTaskSave = (task: Task) => {
    setTasks(prev => prev.some(t => t.id === task.id) ? prev.map(t => t.id === task.id ? task : t) : [...prev, task])
  }

  // ── save (add and edit share the same clash-check branching) ──
  const handleSave = () => {
    const s    = strToMins(modal.startTime)
    const e    = strToMins(modal.endTime)
    const meta = getLinkMeta(modal, roles, activitiesByDimension)
    if (!modal.title.trim() || e <= s || !meta) return

    const id: string = modal.mode === "edit" ? modal.editId! : crypto.randomUUID()
    const task: Task = {
      id,
      title: modal.title.trim(),
      dayIndex: modal.dayIndex,
      startMins: s, endMins: e,
      linkType: modal.linkType,
      linkId: meta.id,
      linkLabel: meta.label,
      isDailyPriority: modal.isDailyPriority,
    }

    const overlapping = getOverlaps(allCalItems, modal.dayIndex, s, e, id)
    if (overlapping.length === 0) {
      applyTaskSave(task)
      setModal(EMPTY_MODAL)
    } else if (overlapping.length === 1) {
      setPendingAction({ type: "save", task })
      setClashWarning({ open: true, conflictingTitle: findTitle(overlapping[0].id) })
    } else {
      setClashBlock(true)
    }
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
      applyTaskSave(pendingAction.task)
      setModal(EMPTY_MODAL)
    }
    setPendingAction(null)
    setClashWarning({ open: false, conflictingTitle: "" })
  }

  const handleClashCancel = () => {
    setPendingAction(null)
    setClashWarning({ open: false, conflictingTitle: "" })
  }

  // ── submit ──
  const handleNext = async () => {
    if (await submit()) router.push("/onboarding/complete")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" onNext={handleNext} nextEnabled={tasks.length > 0 && !isSubmitting && !isLoading} />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <OnboardingStepper currentStep={4} />

          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Schedule <span className="text-primary">Tasks</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Block time for your goals and Sharpen the Saw activities. Click any slot to add a task.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Spinner className="size-8 text-primary" />
              <p className="text-sm text-muted-foreground font-serif">Loading your roles, activities, and appointments…</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <p className="text-sm text-muted-foreground font-serif">Something went wrong loading your data.</p>
              <Button onClick={reload} variant="outline" className="border-border text-foreground hover:bg-secondary/20">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <PastDaysNotice todayIdx={week?.todayIdx ?? null} creates="tasks" />

              <CalendarLegend />

              <WeekCalendar
                fixedAppts={fixedAppts}
                tasks={tasks}
                allCalItems={allCalItems}
                colRefs={colRefs}
                onSlotClick={handleColClick}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onEditTask={openEdit}
                onDeleteTask={id => setTasks(prev => prev.filter(t => t.id !== id))}
                onDragStart={onDragStart}
              />

              <p className="text-sm text-muted-foreground font-serif mt-3">
                Drag tasks to move them. Hover a task to edit or delete. Fixed appointments cannot be moved here.
              </p>
            </>
          )}
        </div>
      </main>

      <TaskModal modal={modal} setModal={setModal} onSave={handleSave} roles={roles} activitiesByDimension={activitiesByDimension} todayIdx={week?.todayIdx ?? null} />

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
