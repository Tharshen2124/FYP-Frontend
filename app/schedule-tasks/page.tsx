"use client"

import { useState, useRef } from "react"
import { Pencil, X, Star, Lock, Flame, Brain, Users, Sparkles } from "lucide-react"
import { AppNav } from "@/components/app-nav"
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

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_FULL  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const CAL_START  = 6
const CAL_END    = 22
const TOTAL_HRS  = CAL_END - CAL_START
const HR_PX      = 64

const FIXED_COLOR = "#3b82f6"

// ─── Mock data (simulates what was set up in previous pages) ─────────────────

interface FixedAppt {
  id: string
  title: string
  dayIndex: number
  startMins: number
  endMins: number
}

const MOCK_FIXED: FixedAppt[] = [
  { id: "fa1", title: "Morning Workout", dayIndex: 0, startMins: 7 * 60, endMins: 8 * 60 },
  { id: "fa2", title: "Morning Workout", dayIndex: 2, startMins: 7 * 60, endMins: 8 * 60 },
  { id: "fa3", title: "Morning Workout", dayIndex: 4, startMins: 7 * 60, endMins: 8 * 60 },
  { id: "fa4", title: "Team Standup",    dayIndex: 0, startMins: 9 * 60, endMins: 9 * 60 + 30 },
  { id: "fa5", title: "Team Standup",    dayIndex: 1, startMins: 9 * 60, endMins: 9 * 60 + 30 },
  { id: "fa6", title: "Team Standup",    dayIndex: 2, startMins: 9 * 60, endMins: 9 * 60 + 30 },
  { id: "fa7", title: "Team Standup",    dayIndex: 3, startMins: 9 * 60, endMins: 9 * 60 + 30 },
  { id: "fa8", title: "Team Standup",    dayIndex: 4, startMins: 9 * 60, endMins: 9 * 60 + 30 },
]

interface MockGoal     { id: string; text: string }
interface MockRole     { id: string; name: string; color: string; goals: MockGoal[] }
interface MockActivity { id: string; text: string }
interface MockDimension { id: string; label: string; color: string; icon: React.ElementType; activities: MockActivity[] }

const MOCK_ROLES: MockRole[] = [
  {
    id: "r1", name: "Professional", color: "#B13BFF",
    goals: [
      { id: "g1", text: "Complete quarterly project milestone" },
      { id: "g2", text: "Mentor junior team member" },
    ],
  },
  {
    id: "r2", name: "Parent", color: "#FFCC00",
    goals: [
      { id: "g3", text: "Plan weekend family activity" },
    ],
  },
  {
    id: "r3", name: "Health", color: "#22c55e",
    goals: [
      { id: "g4", text: "Run 5km three times this week" },
      { id: "g5", text: "Meal prep on Sunday" },
    ],
  },
]

const MOCK_DIMENSIONS: MockDimension[] = [
  {
    id: "physical", label: "Physical", color: "#f97316", icon: Flame,
    activities: [
      { id: "a1", text: "30-minute jog" },
      { id: "a2", text: "Stretching routine" },
    ],
  },
  {
    id: "spiritual", label: "Spiritual", color: "#B13BFF", icon: Sparkles,
    activities: [
      { id: "a3", text: "Morning meditation" },
      { id: "a4", text: "Journal reflection" },
    ],
  },
  {
    id: "mental", label: "Mental", color: "#14b8a6", icon: Brain,
    activities: [
      { id: "a5", text: "Read for 30 minutes" },
      { id: "a6", text: "Online course chapter" },
    ],
  },
  {
    id: "social", label: "Social", color: "#FFCC00", icon: Users,
    activities: [
      { id: "a7", text: "Call a friend" },
      { id: "a8", text: "Family dinner" },
    ],
  },
]

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

type CalItem = { id: string; dayIndex: number; startMins: number; endMins: number }

function getOverlaps(all: CalItem[], dayIndex: number, startMins: number, endMins: number, excludeId: string) {
  return all.filter(
    e => e.id !== excludeId &&
         e.dayIndex === dayIndex &&
         e.startMins < endMins &&
         e.endMins   > startMins
  )
}

function getPositionStyle(item: CalItem, allItems: CalItem[]): React.CSSProperties {
  const overlapping = getOverlaps(allItems, item.dayIndex, item.startMins, item.endMins, item.id)
  if (overlapping.length === 0) return { left: "2px", right: "2px", width: "auto" }

  const group = [item, ...overlapping].sort(
    (a, b) => a.startMins - b.startMins || a.id.localeCompare(b.id)
  )
  const col = group.findIndex(a => a.id === item.id)
  return col === 0
    ? { left: "2px",              width: "calc(50% - 3px)", right: "auto" }
    : { left: "calc(50% + 1px)", width: "calc(50% - 3px)", right: "auto" }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type LinkType = "role-goal" | "sharpen-the-saw"

interface Task {
  id: string
  title: string
  dayIndex: number
  startMins: number
  endMins: number
  color: string
  linkType: LinkType
  linkLabel: string
  isDailyPriority: boolean
}

interface ModalState {
  open: boolean
  mode: "add" | "edit"
  editId?: string
  dayIndex: number
  startTime: string
  endTime: string
  title: string
  linkType: LinkType
  selectedRoleId: string
  selectedGoalId: string
  selectedDimensionId: string
  selectedActivityId: string
  isDailyPriority: boolean
}

type PendingAction =
  | { type: "drop"; draggedId: string; dayIndex: number; newStart: number }
  | { type: "save"; editId: string; title: string; dayIndex: number; startMins: number; endMins: number; color: string; linkType: LinkType; linkLabel: string; isDailyPriority: boolean }

const EMPTY_MODAL: ModalState = {
  open: false,
  mode: "add",
  dayIndex: 0,
  startTime: "09:00",
  endTime: "10:00",
  title: "",
  linkType: "role-goal",
  selectedRoleId: MOCK_ROLES[0]?.id ?? "",
  selectedGoalId: "",
  selectedDimensionId: MOCK_DIMENSIONS[0]?.id ?? "",
  selectedActivityId: "",
  isDailyPriority: false,
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScheduleTasksPage() {
  const [tasks, setTasks]               = useState<Task[]>([])
  const [modal, setModal]               = useState<ModalState>(EMPTY_MODAL)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [clashWarning, setClashWarning] = useState<{ open: boolean; conflictingTitle: string }>({ open: false, conflictingTitle: "" })
  const [clashBlock, setClashBlock]     = useState(false)

  const dragInfo = useRef<{ id: string; offsetMins: number } | null>(null)
  const colRefs  = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null))

  // ── all calendar items for overlap detection ──
  const allCalItems: CalItem[] = [
    ...MOCK_FIXED.map(f => ({ id: f.id, dayIndex: f.dayIndex, startMins: f.startMins, endMins: f.endMins })),
    ...tasks.map(t => ({ id: t.id, dayIndex: t.dayIndex, startMins: t.startMins, endMins: t.endMins })),
  ]

  // ── derive color & label from modal link selection ──
  function getLinkMeta(m: ModalState): { color: string; label: string } | null {
    if (m.linkType === "role-goal") {
      const role = MOCK_ROLES.find(r => r.id === m.selectedRoleId)
      const goal = role?.goals.find(g => g.id === m.selectedGoalId)
      if (!role || !goal) return null
      return { color: role.color, label: `${role.name} — ${goal.text}` }
    } else {
      const dim = MOCK_DIMENSIONS.find(d => d.id === m.selectedDimensionId)
      const act = dim?.activities.find(a => a.id === m.selectedActivityId)
      if (!dim || !act) return null
      return { color: dim.color, label: `${dim.label} — ${act.text}` }
    }
  }

  // ── open add modal ──
  const openAdd = (dayIndex: number, clickY: number) => {
    const raw   = CAL_START * 60 + (clickY / HR_PX) * 60
    const start = Math.max(CAL_START * 60, Math.min((CAL_END - 1) * 60, snapMins(raw)))
    const end   = Math.min(CAL_END * 60, start + 60)
    setModal({ ...EMPTY_MODAL, open: true, mode: "add", dayIndex, startTime: minsToStr(start), endTime: minsToStr(end) })
  }

  const openEdit = (task: Task) => {
    let selectedRoleId = MOCK_ROLES[0]?.id ?? ""
    let selectedGoalId = ""
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
      dayIndex:    task.dayIndex,
      startTime:   minsToStr(task.startMins),
      endTime:     minsToStr(task.endMins),
      title:       task.title,
      linkType:    task.linkType,
      selectedRoleId,
      selectedGoalId,
      selectedDimensionId,
      selectedActivityId,
      isDailyPriority: task.isDailyPriority,
    })
  }

  const handleColClick = (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
    if ((e.target as HTMLElement).closest("[data-task]")) return
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    openAdd(dayIndex, y)
  }

  // ── save ──
  const handleSave = () => {
    const s = strToMins(modal.startTime)
    const e = strToMins(modal.endTime)
    if (!modal.title.trim() || e <= s) return

    const meta = getLinkMeta(modal)
    if (!meta) return

    if (modal.mode === "add") {
      setTasks(prev => [...prev, {
        id: Date.now().toString(),
        title:           modal.title.trim(),
        dayIndex:        modal.dayIndex,
        startMins: s, endMins: e,
        color:           meta.color,
        linkType:        modal.linkType,
        linkLabel:       meta.label,
        isDailyPriority: modal.isDailyPriority,
      }])
      setModal(EMPTY_MODAL)
    } else {
      const overlapping = getOverlaps(allCalItems, modal.dayIndex, s, e, modal.editId!)
      if (overlapping.length === 0) {
        applyTaskSave(modal.editId!, modal.title.trim(), modal.dayIndex, s, e, meta.color, modal.linkType, meta.label, modal.isDailyPriority)
        setModal(EMPTY_MODAL)
      } else if (overlapping.length === 1) {
        setPendingAction({ type: "save", editId: modal.editId!, title: modal.title.trim(), dayIndex: modal.dayIndex, startMins: s, endMins: e, color: meta.color, linkType: modal.linkType, linkLabel: meta.label, isDailyPriority: modal.isDailyPriority })
        setClashWarning({ open: true, conflictingTitle: findTitleForId(overlapping[0].id) })
      } else {
        setClashBlock(true)
      }
    }
  }

  function findTitleForId(id: string) {
    return tasks.find(t => t.id === id)?.title ?? MOCK_FIXED.find(f => f.id === id)?.title ?? "Unknown"
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
    const snapped  = snapMins(rawStart)

    const draggedId = dragInfo.current.id
    dragInfo.current = null

    const dragged = tasks.find(t => t.id === draggedId)
    if (!dragged) return

    const dur      = dragged.endMins - dragged.startMins
    const newStart = Math.max(CAL_START * 60, Math.min(CAL_END * 60 - dur, snapped))
    const newEnd   = newStart + dur

    const overlapping = getOverlaps(allCalItems, dayIndex, newStart, newEnd, draggedId)

    if (overlapping.length === 0) {
      applyDrop(draggedId, dayIndex, newStart)
    } else if (overlapping.length === 1) {
      setPendingAction({ type: "drop", draggedId, dayIndex, newStart })
      setClashWarning({ open: true, conflictingTitle: findTitleForId(overlapping[0].id) })
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

  // ── derived ──
  const canProceed     = tasks.length > 0
  const calH           = TOTAL_HRS * HR_PX
  const endTimeInvalid = strToMins(modal.endTime) <= strToMins(modal.startTime)
  const modalLinkValid = getLinkMeta(modal) !== null
  const canSave        = modal.title.trim().length > 0 && !endTimeInvalid && modalLinkValid

  const selectedRole      = MOCK_ROLES.find(r => r.id === modal.selectedRoleId)
  const selectedDimension = MOCK_DIMENSIONS.find(d => d.id === modal.selectedDimensionId)

  return (
    <div className="min-h-screen bg-background">
      {/* bg blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <AppNav action="next" nextEnabled={canProceed} onNext={() => {}} />

      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Schedule <span className="text-primary">Tasks</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Block time for your goals and renewal activities. Click any slot to add a task.
            </p>
          </div>

          {/* legend */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${FIXED_COLOR}40`, borderLeft: `3px solid ${FIXED_COLOR}` }} />
              <span className="text-xs text-muted-foreground font-serif">Fixed Appointments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary/25" style={{ borderLeft: "3px solid #B13BFF" }} />
              <span className="text-xs text-muted-foreground font-serif">Your Tasks</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-accent fill-accent" />
              <span className="text-xs text-muted-foreground font-serif">Daily Priority</span>
            </div>
          </div>

          {/* ── Calendar ── */}
          <div className="bg-card border-2 border-border rounded-md overflow-hidden">
            {/* day header */}
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

                    {/* fixed appointments (read-only) */}
                    {MOCK_FIXED.filter(f => f.dayIndex === di).map(appt => {
                      const top    = (appt.startMins - CAL_START * 60) * (HR_PX / 60)
                      const height = Math.max((appt.endMins - appt.startMins) * (HR_PX / 60), 22)
                      const posStyle = getPositionStyle(appt, allCalItems)
                      return (
                        <div
                          key={appt.id}
                          data-task
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

                    {/* tasks */}
                    {tasks.filter(t => t.dayIndex === di).map(task => {
                      const top    = (task.startMins - CAL_START * 60) * (HR_PX / 60)
                      const height = Math.max((task.endMins - task.startMins) * (HR_PX / 60), 22)
                      const posStyle = getPositionStyle(task, allCalItems)
                      return (
                        <div
                          key={task.id}
                          data-task
                          draggable
                          onDragStart={e => onDragStart(e, task)}
                          onClick={e => e.stopPropagation()}
                          className="absolute rounded-[5px] px-2 py-0.5 cursor-grab active:cursor-grabbing overflow-hidden group"
                          style={{
                            top, height,
                            backgroundColor: `${task.color}25`,
                            borderLeft: `3px solid ${task.color}`,
                            ...posStyle,
                          }}
                        >
                          <div className="flex items-center gap-1 overflow-hidden">
                            {task.isDailyPriority && (
                              <Star className="w-2.5 h-2.5 flex-shrink-0 fill-accent text-accent" />
                            )}
                            <p className="text-xs font-bold truncate leading-tight" style={{ color: task.color }}>
                              {task.title}
                            </p>
                          </div>
                          {height >= 42 && (
                            <p className="text-[10px] text-muted-foreground leading-tight truncate">
                              {fmtTime(task.startMins)} – {fmtTime(task.endMins)}
                            </p>
                          )}
                          {height >= 56 && (
                            <p className="text-[10px] leading-tight truncate mt-0.5" style={{ color: `${task.color}99` }}>
                              {task.linkLabel}
                            </p>
                          )}

                          {/* edit / delete */}
                          <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5 z-10">
                            <button
                              onClick={e => { e.stopPropagation(); openEdit(task) }}
                              className="p-1 rounded bg-card/90 hover:bg-card transition-colors"
                            >
                              <Pencil className="w-2.5 h-2.5" style={{ color: task.color }} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setTasks(prev => prev.filter(t => t.id !== task.id)) }}
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
            Drag tasks to move them. Hover a task to edit or delete. Fixed appointments cannot be moved here.
          </p>
        </div>
      </main>

      {/* ── Add / Edit Modal ── */}
      <Dialog open={modal.open} onOpenChange={open => { if (!open) setModal(EMPTY_MODAL) }}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {modal.mode === "add" ? "Add Task" : "Edit Task"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-serif">
              {modal.mode === "add"
                ? "Schedule a task linked to a goal or renewal activity."
                : "Update the details of this task."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-bold">Task Name</Label>
              <Input
                autoFocus
                placeholder="e.g., Work on project report, Go for a run…"
                value={modal.title}
                onChange={e => setModal(m => ({ ...m, title: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") handleSave() }}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Day */}
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

            {/* Time */}
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

            {/* Link section */}
            <div className="space-y-3">
              <Label className="text-foreground font-bold">Link To</Label>

              {/* tab toggle */}
              <div className="flex rounded-xl overflow-hidden border-2 border-border">
                <button
                  type="button"
                  onClick={() => setModal(m => ({ ...m, linkType: "role-goal", selectedGoalId: "" }))}
                  className={`flex-1 py-2 text-sm font-bold transition-all ${
                    modal.linkType === "role-goal"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Role Goal
                </button>
                <button
                  type="button"
                  onClick={() => setModal(m => ({ ...m, linkType: "sharpen-the-saw", selectedActivityId: "" }))}
                  className={`flex-1 py-2 text-sm font-bold transition-all ${
                    modal.linkType === "sharpen-the-saw"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sharpen the Saw
                </button>
              </div>

              {/* role-goal panel */}
              {modal.linkType === "role-goal" && (
                <div className="space-y-3">
                  {/* role pills */}
                  <div className="flex flex-wrap gap-2">
                    {MOCK_ROLES.map(role => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setModal(m => ({ ...m, selectedRoleId: role.id, selectedGoalId: "" }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                          modal.selectedRoleId === role.id
                            ? "text-background border-transparent"
                            : "bg-muted border-border text-muted-foreground hover:text-foreground"
                        }`}
                        style={modal.selectedRoleId === role.id ? { backgroundColor: role.color, borderColor: role.color } : {}}
                      >
                        {role.name}
                      </button>
                    ))}
                  </div>

                  {/* goals list */}
                  {selectedRole && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground font-serif">Select a goal from <span className="font-bold" style={{ color: selectedRole.color }}>{selectedRole.name}</span></p>
                      <div className="space-y-1.5">
                        {selectedRole.goals.map(goal => (
                          <button
                            key={goal.id}
                            type="button"
                            onClick={() => setModal(m => ({ ...m, selectedGoalId: goal.id }))}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-serif border-2 transition-all ${
                              modal.selectedGoalId === goal.id
                                ? "border-transparent text-background font-bold"
                                : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                            }`}
                            style={modal.selectedGoalId === goal.id ? { backgroundColor: selectedRole.color, borderColor: selectedRole.color } : {}}
                          >
                            {goal.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* sharpen-the-saw panel */}
              {modal.linkType === "sharpen-the-saw" && (
                <div className="space-y-3">
                  {/* dimension pills */}
                  <div className="grid grid-cols-2 gap-2">
                    {MOCK_DIMENSIONS.map(dim => {
                      const Icon = dim.icon
                      const selected = modal.selectedDimensionId === dim.id
                      return (
                        <button
                          key={dim.id}
                          type="button"
                          onClick={() => setModal(m => ({ ...m, selectedDimensionId: dim.id, selectedActivityId: "" }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                            selected ? "text-background border-transparent" : "bg-muted border-border text-muted-foreground hover:text-foreground"
                          }`}
                          style={selected ? { backgroundColor: dim.color, borderColor: dim.color } : {}}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: selected ? "currentColor" : dim.color }} />
                          {dim.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* activities list */}
                  {selectedDimension && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground font-serif">Select an activity from <span className="font-bold" style={{ color: selectedDimension.color }}>{selectedDimension.label}</span></p>
                      <div className="space-y-1.5">
                        {selectedDimension.activities.map(act => (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => setModal(m => ({ ...m, selectedActivityId: act.id }))}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-serif border-2 transition-all ${
                              modal.selectedActivityId === act.id
                                ? "border-transparent text-background font-bold"
                                : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                            }`}
                            style={modal.selectedActivityId === act.id ? { backgroundColor: selectedDimension.color, borderColor: selectedDimension.color } : {}}
                          >
                            {act.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Daily priority toggle */}
            <button
              type="button"
              onClick={() => setModal(m => ({ ...m, isDailyPriority: !m.isDailyPriority }))}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                modal.isDailyPriority
                  ? "bg-accent/15 border-accent text-foreground"
                  : "bg-muted border-border text-muted-foreground hover:border-accent/40 hover:text-foreground"
              }`}
            >
              <Star className={`w-5 h-5 flex-shrink-0 transition-colors ${modal.isDailyPriority ? "text-accent fill-accent" : "text-muted-foreground"}`} />
              <div className="text-left">
                <p className="text-sm font-bold">Mark as Daily Priority</p>
                <p className="text-xs font-serif text-muted-foreground mt-0.5">
                  Flag this task as one of your most important to-dos for the day.
                </p>
              </div>
            </button>
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
              disabled={!canSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {modal.mode === "add" ? "Add Task" : "Save Changes"}
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
