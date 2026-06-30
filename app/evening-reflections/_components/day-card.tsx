import { Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type DayReflection } from "../_types"

interface Props {
  day: string
  reflection: DayReflection | undefined
  onEdit: (day: string) => void
}

export function DayCard({ day, reflection, onEdit }: Props) {
  const hasText = !!reflection?.text

  return (
    <div className="p-4 rounded-2xl bg-card border-2 border-border hover:border-primary/30 transition-colors flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">{day}</span>
        {hasText && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
      </div>

      <div className="flex-1 min-h-[80px]">
        {hasText ? (
          <p className="text-xs text-muted-foreground font-serif leading-relaxed line-clamp-5">
            {reflection.text}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50 font-serif italic">No reflection yet…</p>
        )}
      </div>

      <Button
        onClick={() => onEdit(day)}
        size="sm"
        className={
          hasText
            ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground w-full"
            : "bg-primary hover:bg-primary/90 text-primary-foreground w-full"
        }
      >
        {hasText ? (
          <>
            <Pencil className="w-3 h-3 mr-1.5" />
            Edit
          </>
        ) : (
          <>
            <Plus className="w-3 h-3 mr-1.5" />
            Create
          </>
        )}
      </Button>
    </div>
  )
}
