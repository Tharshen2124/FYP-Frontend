"use client"

import { useState, useRef } from "react"
import { Lock } from "lucide-react"
import { ClashWarningModal } from "@/components/clash-warning-modal"
import { ClashBlockModal } from "@/components/clash-block-modal"
import { TaskCard } from "./task-card"
import { TaskModal } from "./task-modal"
import { CalendarLegend } from "./calendar-legend"
import type { Task, Appt, CalItem, ModalState, PendingTaskAction } from "../_types"
import type { PlanDimension, PlanRole } from "../../_types"
import { DAYS_FULL, CAL_START, CAL_END, TOTAL_HRS, HR_PX, FIXED_COLOR, EMPTY_TASK_MODAL } from "../_constants/calendar"
import { CalendarDayHeader } from "./calendar-day-header"
import { usePlanWeekDays } from "../_utils/use-plan-week"
import { getOverlaps, getPositionStyle } from "../_utils/calendar"
import { minsToStr, strToMins, snapMins, fmtTime } from "../_utils/time"
import { findLinkSelection, getLinkMeta } from "../_utils/tasks"

interface Props {
  appts: Appt[]
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  roles: PlanRole[]
  dimensions: PlanDimension[]
  /** The Monday being planned, so the calendar prints that week's dates and not this week's. */
  weekStart: string
}

export function TasksTab({ appts, tasks, setTasks, roles, dimensions, weekStart }: Props) {
  const [modal, setModal]                = useState<ModalState>(EMPTY_TASK_MODAL)
  const [pendingAction, setPendingAction] = useState<PendingTaskAction | null>(null)
  const [clashWarning, setClashWarning]  = useState<{ open: boolean; conflictingTitle: string }>({ open: false, conflictingTitle: "" })
  const [clashBlock, setClashBlock]      = useState(false)

  const dragInfo = useRef<{ id: string; offsetMins: number } | null>(null)
  const colRefs  = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null))

  const apptCalItems: CalItem[] = appts.map(a => ({ id: a.id, dayIndex: a.dayIndex, startMins: a.startMins, endMins: a.endMins }))
  const taskCalItems: CalItem[] = tasks.map(t => ({ id: t.id, dayIndex: t.dayIndex, startMins: t.startMins, endMins: t.endMins }))
  const allCalItems: CalItem[]  = [...apptCalItems, ...taskCalItems]

  function findTitle(id: string) {
    return tasks.find(t => t.id === id)?.title ?? appts.find(a => a.id === id)?.title ?? "Unknown"
  }

  const openAdd = (dayIndex: number, clickY: number) => {
    const raw   = CAL_START * 60 + (clickY / HR_PX) * 60
    const start = Math.max(CAL_START * 60, Math.min((CAL_END - 1) * 60, snapMins(raw)))
    const end   = Math.min(CAL_END * 60, start + 60)
    setModal({
      ...EMPTY_TASK_MODAL,
      open: true, mode: "add", dayIndex,
      startTime: minsToStr(start), endTime: minsToStr(end),
      selectedRoleId: roles[0]?.id ?? "",
      selectedDimensionId: dimensions.find(d => d.activities.length > 0)?.id ?? "",
    })
  }

  const openEdit = (task: Task) => {
    setModal({
      open: true, mode: "edit", editId: task.id,
      dayIndex:        task.dayIndex,
      startTime:       minsToStr(task.startMins),
      endTime:         minsToStr(task.endMins),
      title:           task.title,
      linkType:        task.linkType,
      ...findLinkSelection(task, roles, dimensions),
      isDailyPriority: task.isDailyPriority,
    })
  }

  const handleColClick = (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
    if ((e.target as HTMLElement).closest("[data-task]")) return
    if ((e.target as HTMLElement).closest("[data-appt]")) return
    openAdd(dayIndex, e.clientY - e.currentTarget.getBoundingClientRect().top)
  }

  const applyTaskSave = (task: Task) => {
    setTasks(prev => (prev.some(t => t.id === task.id) ? prev.map(t => (t.id === task.id ? task : t)) : [...prev, task]))
  }

  const applyDrop = (draggedId: string, dayIndex: number, newStart: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== draggedId) return t
      const dur = t.endMins - t.startMins
      return { ...t, dayIndex, startMins: newStart, endMins: newStart + dur }
    }))
  }

  const handleSave = () => {
    const s    = strToMins(modal.startTime)
    const e    = strToMins(modal.endTime)
    const meta = getLinkMeta(modal, roles, dimensions)
    if (!modal.title.trim() || e <= s || !meta) return

    const id = modal.mode === "edit" ? modal.editId! : crypto.randomUUID()
    const existing = tasks.find(t => t.id === id)
    const task: Task = {
      id,
      // Carried through so an edit stays an edit: without it the server would see a new task and
      // the completion the user had already recorded would go with the old row.
      taskId: existing?.taskId,
      title: modal.title.trim(),
      dayIndex: modal.dayIndex,
      startMins: s, endMins: e,
      color: meta.color,
      linkType: modal.linkType,
      linkId: meta.id,
      linkLabel: meta.label,
      isDailyPriority: modal.isDailyPriority,
      isCompleted: existing?.isCompleted ?? false,
    }

    const overlapping = getOverlaps(allCalItems, modal.dayIndex, s, e, id)
    if (overlapping.length === 0) {
      applyTaskSave(task)
      setModal(EMPTY_TASK_MODAL)
    } else if (overlapping.length === 1) {
      setPendingAction({ type: "save", task })
      setClashWarning({ open: true, conflictingTitle: findTitle(overlapping[0].id) })
    } else {
      setClashBlock(true)
    }
  }

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

    const y         = e.clientY - col.getBoundingClientRect().top
    const rawStart  = CAL_START * 60 + (y / HR_PX) * 60 - dragInfo.current.offsetMins
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

  const handleClashProceed = () => {
    if (pendingAction?.type === "drop") {
      applyDrop(pendingAction.draggedId, pendingAction.dayIndex, pendingAction.newStart)
    } else if (pendingAction?.type === "save") {
      applyTaskSave(pendingAction.task)
      setModal(EMPTY_TASK_MODAL)
    }
    setPendingAction(null)
    setClashWarning({ open: false, conflictingTitle: "" })
  }

  const handleClashCancel = () => {
    setPendingAction(null)
    setClashWarning({ open: false, conflictingTitle: "" })
  }

  const week = usePlanWeekDays(weekStart)
  const calH = TOTAL_HRS * HR_PX

  return (
    <>
      <CalendarLegend />

      <div className="bg-card border-2 border-border rounded-md overflow-hidden">
        <CalendarDayHeader week={week} />

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

            {DAYS_FULL.map((day, di) => (
              <div
                key={day}
                data-day-column={di}
                ref={el => { colRefs.current[di] = el }}
                className={[
                  "relative border-l border-border cursor-pointer select-none",
                  week != null && week.todayIdx !== -1 && di < week.todayIdx ? "bg-foreground/[0.06]" : "",
                ].join(" ")}
                style={{ height: calH }}
                onClick={e => handleColClick(e, di)}
                onDragOver={onDragOver}
                onDrop={e => onDrop(e, di)}
              >
                {Array.from({ length: TOTAL_HRS }, (_, i) => (
                  <div key={i} className="absolute w-full border-t border-border/50" style={{ top: i * HR_PX }} />
                ))}
                {Array.from({ length: TOTAL_HRS }, (_, i) => (
                  <div key={`h${i}`} className="absolute w-full border-t border-border/20" style={{ top: i * HR_PX + HR_PX / 2 }} />
                ))}

                {/* Fixed appointments — read-only */}
                {appts.filter(a => a.dayIndex === di).map(appt => {
                  const top      = (appt.startMins - CAL_START * 60) * (HR_PX / 60)
                  const height   = Math.max((appt.endMins - appt.startMins) * (HR_PX / 60), 22)
                  const posStyle = getPositionStyle(appt, allCalItems)
                  return (
                    <div
                      key={appt.id}
                      data-appt
                      onClick={e => e.stopPropagation()}
                      className="absolute rounded-[5px] px-2 py-0.5 overflow-hidden"
                      style={{
                        top, height,
                        backgroundColor: `${FIXED_COLOR}20`,
                        borderLeft: `3px solid ${FIXED_COLOR}`,
                        ...posStyle,
                      }}
                    >
                      <div className="flex items-center gap-1 overflow-hidden">
                        <Lock className="w-2.5 h-2.5 flex-shrink-0" style={{ color: FIXED_COLOR }} />
                        <p className="text-xs font-bold truncate leading-tight" style={{ color: FIXED_COLOR }}>
                          {appt.title}
                        </p>
                      </div>
                      {height >= 42 && (
                        <p className="text-[10px] text-muted-foreground leading-tight truncate">
                          {fmtTime(appt.startMins)} – {fmtTime(appt.endMins)}
                        </p>
                      )}
                    </div>
                  )
                })}

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
        Drag tasks to move them. Fixed appointments are shown for reference and cannot be moved here.
        A task you have already completed can be moved or renamed, but not removed.
      </p>

      <TaskModal
        modal={modal}
        setModal={setModal}
        onSave={handleSave}
        roles={roles}
        dimensions={dimensions}
      />

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
