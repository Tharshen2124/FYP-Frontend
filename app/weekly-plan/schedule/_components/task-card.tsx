import { Pencil, X, Star } from "lucide-react"
import type { Task, CalItem } from "../_types"
import { HR_PX, CAL_START } from "../_constants/calendar"
import { getPositionStyle } from "../_utils/calendar"
import { fmtTime } from "../_utils/time"

interface Props {
  task: Task
  allCalItems: CalItem[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, task: Task) => void
}

export function TaskCard({ task, allCalItems, onEdit, onDelete, onDragStart }: Props) {
  const top      = (task.startMins - CAL_START * 60) * (HR_PX / 60)
  const height   = Math.max((task.endMins - task.startMins) * (HR_PX / 60), 22)
  const posStyle = getPositionStyle(task, allCalItems)

  return (
    <div
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
      <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5 z-10">
        <button
          onClick={e => { e.stopPropagation(); onEdit(task) }}
          className="p-1 rounded bg-card/90 hover:bg-card transition-colors"
        >
          <Pencil className="w-2.5 h-2.5" style={{ color: task.color }} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(task.id) }}
          className="p-1 rounded bg-card/90 hover:bg-card transition-colors"
        >
          <X className="w-2.5 h-2.5 text-destructive" />
        </button>
      </div>
    </div>
  )
}
