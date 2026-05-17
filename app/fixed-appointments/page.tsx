"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Sparkles, ChevronRight, Pencil, X } from "lucide-react"
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

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const CAL_START = 6   // 6 AM
const CAL_END   = 22  // 10 PM
const TOTAL_HRS = CAL_END - CAL_START
const HR_PX     = 64  // pixels per hour  →  1 min = HR_PX/60 px

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
  const [appts, setAppts]     = useState<Appt[]>([])
  const [modal, setModal]     = useState<ModalState>(EMPTY_MODAL)
  const colorCursor           = useRef(0)
  const dragInfo              = useRef<{ id: string; offsetMins: number } | null>(null)
  const colRefs               = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null))

  // ── colour cycling ──
  const nextColor = () => COLORS[colorCursor.current++ % COLORS.length]

  // ── open add modal from click on empty slot ──
  const openAdd = (dayIndex: number, clickY: number) => {
    const raw = CAL_START * 60 + (clickY / HR_PX) * 60
    const start = Math.max(CAL_START * 60, Math.min((CAL_END - 1) * 60, snapMins(raw)))
    const end   = Math.min(CAL_END * 60, start + 60)
    setModal({ open: true, mode: "add", dayIndex, startTime: minsToStr(start), endTime: minsToStr(end), title: "", description: "" })
  }

  const openEdit = (appt: Appt) =>
    setModal({
      open: true, mode: "edit", editId: appt.id,
      dayIndex: appt.dayIndex,
      startTime: minsToStr(appt.startMins), endTime: minsToStr(appt.endMins),
      title: appt.title, description: appt.description,
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
        title: modal.title.trim(),
        description: modal.description.trim(),
        dayIndex: modal.dayIndex,
        startMins: s, endMins: e,
        color: nextColor(),
      }])
    } else {
      setAppts(prev => prev.map(a =>
        a.id === modal.editId
          ? { ...a, title: modal.title.trim(), description: modal.description.trim(), dayIndex: modal.dayIndex, startMins: s, endMins: e }
          : a
      ))
    }
    setModal(EMPTY_MODAL)
  }

  // ── drag ──
  const onDragStart = (e: React.DragEvent, appt: Appt) => {
    const offsetY  = e.clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top
    dragInfo.current = { id: appt.id, offsetMins: Math.round((offsetY / HR_PX) * 60) }
    // invisible drag ghost
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
    // Capture id before clearing the ref — the state updater runs asynchronously
    // and dragInfo.current would already be null by the time it executes.
    const draggedId = dragInfo.current.id
    dragInfo.current = null
    setAppts(prev => prev.map(a => {
      if (a.id !== draggedId) return a
      const dur     = a.endMins - a.startMins
      const clamped = Math.max(CAL_START * 60, Math.min(CAL_END * 60 - dur, snapped))
      return { ...a, dayIndex, startMins: clamped, endMins: clamped + dur }
    }))
  }

  // ── derived ──
  const canProceed    = appts.length > 0
  const calH          = TOTAL_HRS * HR_PX
  const endTimeInvalid = strToMins(modal.endTime) <= strToMins(modal.startTime)

  return (
    <div className="min-h-screen bg-background">
      {/* bg blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      {/* nav */}
      <nav className="relative z-10 px-6 py-4 border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">HabitFlow</span>
          </Link>
          <Button
            variant="outline"
            disabled={!canProceed}
            className="border-border text-foreground hover:bg-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {}}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </nav>

      {/* main */}
      <main className="relative z-10 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Fixed <span className="text-primary">Appointments</span>
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              Click any time slot to add a recurring commitment. Drag to reschedule.
            </p>
          </div>

          {/* ── Calendar ── */}
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
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
                    const hour = i + CAL_START
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
                      <div key={i} className="absolute w-full border-t border-border/50" style={{ top: i * HR_PX }} />
                    ))}
                    {/* half-hour lines */}
                    {Array.from({ length: TOTAL_HRS }, (_, i) => (
                      <div key={`h${i}`} className="absolute w-full border-t border-border/20" style={{ top: i * HR_PX + HR_PX / 2 }} />
                    ))}

                    {/* appointments */}
                    {appts.filter(a => a.dayIndex === di).map(appt => {
                      const top    = (appt.startMins - CAL_START * 60) * (HR_PX / 60)
                      const height = Math.max((appt.endMins - appt.startMins) * (HR_PX / 60), 22)
                      return (
                        <div
                          key={appt.id}
                          data-appt
                          draggable
                          onDragStart={e => onDragStart(e, appt)}
                          onClick={e => e.stopPropagation()}
                          className="absolute left-1 right-1 rounded-lg px-2 py-0.5 cursor-grab active:cursor-grabbing overflow-hidden group"
                          style={{ top, height, backgroundColor: `${appt.color}25`, borderLeft: `3px solid ${appt.color}` }}
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

      {/* ── Modal ── */}
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
            {/* title */}
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

            {/* day picker */}
            <div className="space-y-1.5">
              <Label className="text-foreground font-bold">Day</Label>
              <div className="grid grid-cols-7 gap-1">
                {DAYS_SHORT.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setModal(m => ({ ...m, dayIndex: i }))}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
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

            {/* time range */}
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

            {/* description */}
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
    </div>
  )
}
