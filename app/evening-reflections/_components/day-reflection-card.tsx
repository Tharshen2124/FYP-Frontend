"use client"

import { Eye, Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DAYS } from "../_constants/reflections"
import type { DayReflection } from "../_types"

interface Props {
  dayIndex: number
  date: Date
  reflection?: DayReflection
  /** False once the week has ended: the entry can be read, never rewritten. */
  isEditable: boolean
  onOpen: () => void
}

export function DayReflectionCard({ dayIndex, date, reflection, isEditable, onOpen }: Props) {
  const day = DAYS[dayIndex]
  const hasText = !!reflection?.text
  const dateLabel = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })

  // Four states, not two. A finished week keeps its entries readable but offers no way in, and an
  // empty day in a finished week has nothing to open at all.
  const action = !isEditable && !hasText ? "none" : !isEditable ? "view" : hasText ? "edit" : "create"

  return (
    <div
      data-day-index={dayIndex}
      className={`p-4 rounded-2xl bg-card border-2 border-border transition-colors flex flex-col gap-3 ${
        action === "none" ? "opacity-60" : "hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-foreground">{day}</span>
          <span className="text-xs text-muted-foreground font-serif ml-1.5">{dateLabel}</span>
        </div>
        {hasText && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
      </div>

      <div className="flex-1 min-h-[80px]">
        {hasText ? (
          <p className="text-xs text-muted-foreground font-serif leading-relaxed line-clamp-5">
            {reflection.text}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50 font-serif italic">
            {isEditable ? "No reflection yet…" : "Not written"}
          </p>
        )}
      </div>

      {action === "create" && (
        <Button
          onClick={onOpen}
          size="sm"
          aria-label={`Create ${day} reflection`}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
        >
          <Plus className="w-3 h-3 mr-1.5" />
          Create
        </Button>
      )}
      {action === "edit" && (
        <Button
          onClick={onOpen}
          size="sm"
          aria-label={`Edit ${day} reflection`}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground w-full"
        >
          <Pencil className="w-3 h-3 mr-1.5" />
          Edit
        </Button>
      )}
      {action === "view" && (
        <Button
          onClick={onOpen}
          size="sm"
          variant="outline"
          aria-label={`View ${day} reflection`}
          className="border-border text-foreground hover:bg-secondary/20 w-full"
        >
          <Eye className="w-3 h-3 mr-1.5" />
          View
        </Button>
      )}
    </div>
  )
}
