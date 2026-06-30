import { Plus, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type Dimension } from "../_types"

interface Props {
  dim: Dimension
  input: string
  editingId: { dimId: string; actId: string } | null
  editText: string
  onInputChange: (dimId: string, value: string) => void
  onAdd: (dimId: string) => void
  onTogglePriority: (dimId: string, actId: string) => void
  onDelete: (dimId: string, actId: string) => void
  onEditStart: (dimId: string, actId: string, text: string) => void
  onEditChange: (text: string) => void
  onEditCommit: () => void
  onEditCancel: () => void
}

export function DimensionCard({
  dim,
  input,
  editingId,
  editText,
  onInputChange,
  onAdd,
  onTogglePriority,
  onDelete,
  onEditStart,
  onEditChange,
  onEditCommit,
  onEditCancel,
}: Props) {
  const Icon = dim.icon

  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${dim.color}20` }}>
          <Icon className="w-6 h-6" style={{ color: dim.color }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{dim.label}</h2>
          <p className="text-sm text-muted-foreground font-serif">{dim.description}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {dim.activities.map(act => (
          <div key={act.id} className={`flex items-center justify-between p-3 rounded-xl group transition-colors ${act.isWeeklyPriority ? "bg-accent/10 border border-accent/30" : "bg-muted/50"}`}>
            {editingId?.dimId === dim.id && editingId?.actId === act.id ? (
              <Input
                autoFocus
                value={editText}
                onChange={e => onEditChange(e.target.value)}
                onBlur={onEditCommit}
                onKeyDown={e => {
                  if (e.key === "Enter") onEditCommit()
                  if (e.key === "Escape") onEditCancel()
                }}
                className="bg-muted border-border text-foreground h-8 py-0 mr-2"
              />
            ) : (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dim.color }} />
                <span
                  className="text-foreground font-serif truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={() => onEditStart(dim.id, act.id, act.text)}
                >
                  {act.text}
                </span>
                {act.isWeeklyPriority && (
                  <span className="text-xs font-medium bg-accent/20 text-accent rounded-full px-2 py-0.5 whitespace-nowrap">Priority</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTogglePriority(dim.id, act.id)}
                className={`p-1 h-auto transition-opacity ${act.isWeeklyPriority ? "text-accent" : "text-muted-foreground hover:text-accent opacity-0 group-hover:opacity-100"}`}
                title={act.isWeeklyPriority ? "Remove weekly priority" : "Mark as weekly priority"}
              >
                <Star className={`w-4 h-4 ${act.isWeeklyPriority ? "fill-accent" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(dim.id, act.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0 p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder={`Add a ${dim.label.toLowerCase()} activity...`}
          value={input}
          onChange={e => onInputChange(dim.id, e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onAdd(dim.id) }}
          className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
        />
        <Button onClick={() => onAdd(dim.id)} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
